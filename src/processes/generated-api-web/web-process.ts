import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import compression from 'compression';
import * as OpenApiValidator from 'express-openapi-validator';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

import { logger } from '../../services/logger';
import setupRoutes from './api';
import spec from '../../config/openapi/spec';
import {
  amqpConfig,
  contractAddress,
  tezosNodeUrls,
  webProcessConfig,
} from '../../config';
import { PostgreService } from '../../services/postgre';
import { errorHandler } from '../web/middleware/error-handler';
import { AmqpService } from '../../services/amqp';
import { AbstractProcess } from '../abstract-process';
import { GatewayPool } from '../../services/gateway-pool';
import { generatePathObject } from '../../lib/generate-path-object';
import swaggerUI from 'swagger-ui-express';
import { SignerFactory } from '../../services/signer-factory';
import { MetricPrometheusService } from '../../services/metric-prometheus';

export interface WebConfig {
  server: {
    port: number;
  };
}

export class WebProcess extends AbstractProcess {
  protected _app: express.Application;
  protected _server: http.Server;
  protected _webConfig: WebConfig['server'];
  protected _isRunning: boolean = false;

  protected _postgreService: PostgreService;
  private _gatewayPool: GatewayPool;
  protected _amqpService: AmqpService;
  private _signerFactory: SignerFactory;
  private _metricPrometheusService: MetricPrometheusService;

  constructor(config: WebConfig) {
    super(webProcessConfig, logger);
    this._webConfig = config.server;
    this._app = express();
    this._server = http.createServer(this._app);

    this._postgreService = new PostgreService();
    this._gatewayPool = new GatewayPool(tezosNodeUrls, logger);
    this._amqpService = new AmqpService(amqpConfig, this.logger);
    this._signerFactory = new SignerFactory();
    this._metricPrometheusService = new MetricPrometheusService();
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get app(): Express.Application {
    return this._app;
  }

  public get postgreService(): PostgreService {
    return this._postgreService;
  }

  public set postgreService(service: PostgreService) {
    this._postgreService = service;
  }

  public get amqpService(): AmqpService {
    return this._amqpService;
  }

  public set amqpService(service: AmqpService) {
    this._amqpService = service;
  }

  get gatewayPool(): GatewayPool {
    return this._gatewayPool;
  }

  public get signerFactory(): SignerFactory {
    return this._signerFactory;
  }

  public set signerFactory(signerFactory: SignerFactory) {
    this._signerFactory = signerFactory;
  }

  public get metricPrometheusService(): MetricPrometheusService {
    return this._metricPrometheusService;
  }

  public set metricPrometheusService(
    metricPrometheus: MetricPrometheusService,
  ) {
    this._metricPrometheusService = metricPrometheus;
  }

  /**
   * Start steps:
   *  - Check if the web process is already running
   *  - If not, Start services
   *  - Start web application (express)
   */
  public async start(): Promise<boolean> {
    if (this._isRunning) {
      logger.info({}, 'Server already running');
      return false;
    }

    await this._postgreService.initializeDatabase();
    await this._amqpService.start();
    this._metricPrometheusService.start();

    const tezosService = await this.gatewayPool.getTezosService();

    logger.info(
      {
        tezosNode: tezosService.tezos.rpc.getRpcUrl(),
      },
      'Using this tezos node to get contract schema',
    );

    const forgeAndSendPaths = await generatePathObject(
      logger,
      tezosService,
      contractAddress,
    );

    this.expressSetup(forgeAndSendPaths);

    setupRoutes(
      this._app,
      this._gatewayPool,
      this._postgreService,
      this._amqpService,
      this._signerFactory,
      this._metricPrometheusService,
      forgeAndSendPaths,
    );

    this.appPostConfig();

    this._server.listen({ port: this._webConfig.port });
    this._isRunning = true;
    this.logger.info(
      { port: this._webConfig.port, environment: process.env.NODE_ENV },
      '✔ Server running',
    );

    return true;
  }

  /**
   * Stop steps:
   *  - Check if the process is running
   *  - If it is, stop services
   *  - Close the web server (express)
   */
  public async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    await this._postgreService.disconnect();
    await this._amqpService.stop();
    await this._metricPrometheusService.stop();

    await new Promise((resolve) => this._server.close(resolve));
    this._isRunning = false;

    return true;
  }

  /**
   * Setup various shared middleware & heartbeat route for express app
   */
  protected appPreConfig(): express.Application {
    this._app.use(compression());
    this._app.use(bodyParser.urlencoded({ extended: false }));
    this._app.use(bodyParser.json());

    this._app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, X-Request-Token',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH',
      );

      if (req.method === 'OPTIONS') {
        return res.send();
      }

      return next();
    });

    this._app.set('port', this._webConfig.port);

    return this._app;
  }

  /**
   * Setup the express application
   */
  protected expressSetup(forgeAndSendPaths: OpenAPIV3.PathsObject) {
    this.appPreConfig();

    const apiSpec = {
      ...spec,
      paths: this.setUpPathObjects(forgeAndSendPaths),
    } as unknown as OpenAPIV3.Document;

    this._app.use(
      '/api',
      OpenApiValidator.middleware({
        apiSpec,
        validateRequests: true,
        validateResponses: true,
      }),
    );

    this._app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(apiSpec));
  }

  private setUpPathObjects(forgeAndSendPaths: OpenAPIV3.PathsObject) {
    return {
      ...forgeAndSendPaths,
      '/inject': spec.paths['/inject/jobs'],
      '/async/inject': spec.paths['/async/inject/jobs'],
      '/entrypoints/{contract_address}':
        spec.paths['/entrypoints/{contract_address}'],
      '/tezos_node/storage/{contract_address}':
        spec.paths['/tezos_node/storage/{contract_address}'],
    };
  }

  /**
   * Setup default middleware used after application routes are mounted (errors, ...)
   */
  protected appPostConfig() {
    this._app.use(errorHandler());
  }
}
