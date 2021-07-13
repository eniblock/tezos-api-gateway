import { MetricConfig } from '../const/interfaces/metric-config';
import { metricConfig } from '../config';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider } from '@opentelemetry/metrics';
import { Counter } from '@opentelemetry/api-metrics';

export class MetricPrometheusService {
  private _config: MetricConfig;
  private _exporter: PrometheusExporter | undefined;
  private _meter: Meter | undefined;
  private _entryPointCounter: Counter | undefined;

  constructor(config: MetricConfig = metricConfig) {
    this._config = config;
  }

  public get entryPointCounter(): Counter {
    return this._entryPointCounter as Counter;
  }

  public start() {
    this._exporter = new PrometheusExporter({
      port: this._config.port,
      preventServerStart: this._config.preventServerStart,
    });
    this._meter = new MeterProvider({
      exporter: this._exporter,
      interval: this._config.interval,
    }).getMeter(this._config.meterName);

    this._entryPointCounter = this._meter.createCounter('entry_point_call', {
      description:
        'This metric will count the number of calls for an entry point per smart contract address',
    });
    this._entryPointCounter.bind({ pid: process.pid.toString() });
  }

  public async stop() {
    await this._meter?.shutdown();
    await this._exporter?.shutdown();
    await this._exporter?.stopServer();
  }
}
