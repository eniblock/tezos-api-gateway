import supertest from 'supertest';

import {
  amqpConfig,
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { logger } from '../../../../../__fixtures__/services/logger';
import {
  flexibleTokenContract,
  signature,
  signedTransaction,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

import { resetTable } from '../../../../../__utils__/postgre';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import * as jobModel from '../../../../../../src/models/jobs';
import { PostgreService } from '../../../../../../src/services/postgre';
import { forgeOperation } from '../../../../../../src/lib/jobs/forge-operation';
import { AmqpService } from '../../../../../../src/services/amqp';
import { TezosService } from '../../../../../../src/services/tezos';
import { TezosPreapplyFailureError } from '@taquito/taquito';
import { ForgeOperationParams } from '../../../../../../src/const/interfaces/forge-operation-params';

describe('[processes/web/api/jobs] Inject job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);
  const amqpService = new AmqpService(amqpConfig, logger);

  webProcess.postgreService = postgreService;
  webProcess.amqpService = amqpService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);

    jest
      .spyOn(webProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#injectOperationAndUpdateJobAsync', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request
        .patch('/api/async/inject/jobs')
        .send({
          jobId: 1,
          signature: 'signature',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          "request.body should have required property 'signedTransaction'",
        status: 400,
      });
    });

    it('should return 400 when there is a parameter not match the format', async () => {
      const { body, status } = await request
        .patch('/api/async/inject/jobs')
        .send({
          jobId: '1',
          signature: 'signature',
          signedTransaction: 'signedTransaction',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body.jobId should be number',
        status: 400,
      });
    });

    it('should return 404 when could not find the job with this id', async () => {
      const { body, status } = await request
        .patch('/api/async/inject/jobs')
        .send({
          jobId: 1,
          signature: 'signature',
          signedTransaction: 'signedTransaction',
        });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'Could not find any jobs with this id 1',
        status: 404,
      });
    });

    it('should return 400 when a preapply error happen', async () => {
      const estimation = [
        {
          suggestedFeeMutez: 100,
          storageLimit: 500,
          gasLimit: 1000,
        },
      ];
      jest
        .spyOn(tezosService.tezos.estimate, 'batch')
        .mockResolvedValue(estimation as any);
      const testForgeOperation: ForgeOperationParams = {
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'lock',
          },
        ],
        callerId: 'myCaller',
        publicKey: '',
        sourceAddress: testAccount,
        useCache: true,
        reveal: false,
      };
      const insertedJob = await forgeOperation(
        testForgeOperation,
        tezosService,
        postgreService,
      );
      jest
        .spyOn(tezosService, 'preapplyOperations')
        .mockRejectedValue(
          new TezosPreapplyFailureError(
            'Preapply returned an unexpected result',
          ),
        );
      const { body, status } = await request.patch('/api/inject/jobs').send({
        jobId: insertedJob.id,
        signature,
        signedTransaction,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'Preapply returned an unexpected result',
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(jobModel, 'selectJobs')
        .mockRejectedValue(new Error('Unexpected error'));

      const { body, status } = await request
        .patch('/api/async/inject/jobs')
        .send({
          jobId: 1,
          signature: 'signature',
          signedTransaction: 'signedTransaction',
        });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 200 and the hash operation, correctly updated the data in database', async () => {
      jest.spyOn(tezosService.tezos.estimate, 'batch').mockResolvedValue([
        {
          suggestedFeeMutez: 500,
          storageLimit: 500,
          gasLimit: 500,
        },
      ] as any);

      const { gas, fee, ...createdJob } = await forgeOperation(
        {
          transactions: [
            {
              contractAddress: flexibleTokenContract,
              entryPoint: 'transfer',
              entryPointParams: {
                tokens: 1,
                destination: testAccount2,
              },
            },
          ],
          callerId: 'myCaller',
          publicKey: '',
          sourceAddress: testAccount,
          useCache: true,
          reveal: false,
        },
        tezosService,
        postgreService,
      );

      const amqpSendToQueueSpy = jest
        .spyOn(amqpService, 'sendToQueue')
        .mockImplementation();

      const { body, status } = await request
        .patch('/api/async/inject/jobs')
        .send({
          jobId: createdJob.id,
          signature,
          signedTransaction,
        });

      expect({ body, status }).toEqual({
        status: 200,
        body: createdJob,
      });

      expect(amqpSendToQueueSpy.mock.calls).toEqual([
        [
          {
            jobId: createdJob.id,
            signature,
            signedTransaction,
          },
          'inject-transaction',
        ],
      ]);
    });
  });
});
