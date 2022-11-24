import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import {
  activatedAccount,
  FA2Contract,
  FA2Contract7,
  flexibleTokenContract,
  revealedAccount,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { TezosService } from '../../../../../../src/services/tezos';
import { ForgeOperationBodyParams } from '../../../../../../src/const/interfaces/forge-operation-params';
import * as estimateLib from '../../../../../../src/lib/jobs/estimate-operation';
import { TezosOperationError } from '@taquito/taquito';
import { PostgreService } from '../../../../../../src/services/postgre';

describe('[processes/web/api/jobs] Estimate job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeUrl);
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(async () => {
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

  describe('#getOperationEstimation', () => {
    const transaction = {
      contractAddress: flexibleTokenContract,
      entryPoint: 'transfer',
      entryPointParams: {
        tokens: 1,
        destination: testAccount2,
      },
    };
    const requestBodyParam: ForgeOperationBodyParams = {
      transactions: [
        transaction,
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'lock',
        },
      ],
      sourceAddress: revealedAccount.address,
    };
    const estimationResults = [
      {
        amount: 0,
        counter: 10240865,
        destination: flexibleTokenContract,
        gasEstimation: 2703,
        gasLimit: 2804,
        kind: 'transaction',
        minimalFee: 489,
        parameters: {
          entrypoint: 'transfer',
          value: {
            args: [
              {
                string: testAccount2,
              },
              {
                int: '1',
              },
            ],
            prim: 'Pair',
          },
        },
        parametersJson: {
          entrypoint: 'transfer',
          value: {
            transfer: {
              destination: testAccount2,
              tokens: 1,
            },
          },
        },
        source: revealedAccount.address,
        storageAndAllocationFee: 0,
        storageLimit: 0,
        suggestedFee: 589,
      },
      {
        amount: 0,
        counter: 10240866,
        destination: flexibleTokenContract,
        gasEstimation: 1212,
        gasLimit: 1313,
        kind: 'transaction',
        minimalFee: 340,
        parameters: {
          entrypoint: 'lock',
          value: {
            prim: 'Unit',
          },
        },
        parametersJson: {
          entrypoint: 'lock',
          value: {
            lock: 0,
          },
        },
        source: revealedAccount.address,
        storageAndAllocationFee: 0,
        storageLimit: 0,
        suggestedFee: 440,
      },
    ];

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        sourceAddress: revealedAccount.address,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'transactions'",
        status: 400,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
        extra: 'extra',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 400 when there is a parameter not match the format', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: FA2Contract7,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 1,
              destination: testAccount2,
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.transactions[0].contractAddress should match pattern "^KT+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('should return 400 when entry point parameters does not match entry schema', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              fakeParam: 5,
              destination: testAccount2,
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'Missing parameter name, No child object has the name "tokens"',
        status: 400,
      });
    });

    it('should return 400 when there is a parameter type validation error', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 'string',
              destination: testAccount2,
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: '[tokens] Value is not a number: string',
        status: 400,
      });
    });

    it('should return 400 when a map parameter does not match the map structure', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: FA2Contract,
            entryPoint: 'mint',
            entryPointParams: {
              amount: 100,
              address: testAccount,
              token_id: 1,
              metadata: [
                {
                  name: '54686520546f6b656e204f6e65',
                },
              ],
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'Invalid map structure, map have to respect the type: {"key": <key>, "value": <value>}[]',
        status: 400,
      });
    });

    it('should return 400 when reveal is false and the address is not revealed', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=false')
        .send({
          ...requestBodyParam,
          sourceAddress: activatedAccount.address,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: `Address ${activatedAccount.address} is not revealed`,
        status: 400,
      });
    });

    it("should return 400 when reveal is true and the address isn't related to the publicKey", async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=true')
        .send({
          ...requestBodyParam,
          sourceAddress: activatedAccount.address,
          publicKey: revealedAccount.publicKey,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: `Address ${activatedAccount.address} is not revealed`,
        status: 400,
      });
    });

    it('should return 400 when publicKey is undefined when reveal is true', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=true')
        .send({
          ...requestBodyParam,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'publicKey should be defined when reveal is true',
        status: 400,
      });
    });

    it('should return 400 when number of transactions exceeds 5 with no reveal', async () => {
      const { body, status } = await request.get('/api/estimate/jobs').send({
        transactions: [
          transaction,
          transaction,
          transaction,
          transaction,
          transaction,
          transaction,
        ],
        sourceAddress: revealedAccount.address,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'Exceeded maximum number of operations per batch authorized (5)',
        status: 400,
      });
    });

    it('should return 404 when could not find the address', async () => {
      const getContractResponseSpy = jest
        .spyOn(tezosService, 'getContractResponse')
        .mockResolvedValue({} as any);

      const { body, status } = await request
        .get('/api/estimate/jobs')
        .send(requestBodyParam);

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: `Could not find the adress: ${revealedAccount.address}`,
        status: 404,
      });

      expect(getContractResponseSpy.mock.calls).toEqual([
        [revealedAccount.address],
      ]);
    });

    it('should return 400 when an operation error happen', async () => {
      jest.spyOn(tezosService.tezos.estimate, 'batch').mockRejectedValue(
        new TezosOperationError([
          {
            kind: 'temporary',
            id: 'proto.011-PtHangz2.michelson_v1.script_rejected',
          },
        ]),
      );

      const { body } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
      });

      expect(body).toEqual({
        message: '(temporary) proto.011-PtHangz2.michelson_v1.script_rejected',
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(estimateLib, 'estimateOperation')
        .mockRejectedValue(new Error('Unexpected error'));

      const { body, status } = await request.get('/api/estimate/jobs').send({
        ...requestBodyParam,
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 200 and the estimation result', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs')
        .send(requestBodyParam);

      expect({ body, status }).toEqual({
        status: 200,
        body: estimationResults,
      });
    }, 8000);

    it('should return 200 and the operation estimation when reveal is true and the address is already revealed', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=true')
        .send({
          ...requestBodyParam,
          publicKey: revealedAccount.publicKey,
        });

      expect({ body, status }).toEqual({
        status: 200,
        body: estimationResults,
      });
    }, 10000);

    it('should return 200 and include the reveal operation estimation when reveal is true and the address is not revealed', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=true')
        .send({
          ...requestBodyParam,
          sourceAddress: activatedAccount.address,
          publicKey: activatedAccount.publicKey,
        });

      expect({ body, status }).toEqual({
        status: 200,
        body: [
          {
            counter: 10240927,
            gasEstimation: 1000,
            gasLimit: 1100,
            kind: 'reveal',
            minimalFee: 274,
            public_key: activatedAccount.publicKey,
            source: activatedAccount.address,
            storageAndAllocationFee: 0,
            storageLimit: 0,
            suggestedFee: 374,
          },
          {
            ...estimationResults[0],
            counter: 10240928,
            source: activatedAccount.address,
            minimalFee: 521,
            suggestedFee: 621,
          },
          {
            ...estimationResults[1],
            counter: 10240929,
            source: activatedAccount.address,
            minimalFee: 372,
            suggestedFee: 472,
          },
        ],
      });
    }, 10000);

    it('should return 200 when number of transactions equals 5 and reveal=true, but with address already revealed', async () => {
      const { body, status } = await request
        .get('/api/estimate/jobs?reveal=true')
        .send({
          transactions: [
            transaction,
            transaction,
            transaction,
            transaction,
            transaction,
          ],
          sourceAddress: revealedAccount.address,
          publicKey: revealedAccount.publicKey,
        });

      expect(status).toEqual(200);
      expect(body.length).toEqual(5);
    }, 10000);

    it('should return 200 and correctly return estimations when amount is specified', async () => {
      requestBodyParam.transactions[0].amount = 10;
      requestBodyParam.transactions[1].amount = 100;

      const { body, status } = await request
        .get('/api/estimate/jobs')
        .send(requestBodyParam);

      expect({ body, status }).toEqual({
        status: 200,
        body: [
          {
            ...estimationResults[0],
            amount: 10,
            minimalFee: 492,
            suggestedFee: 592,
          },
          {
            ...estimationResults[1],
            amount: 100,
            minimalFee: 343,
            suggestedFee: 443,
          },
        ],
      });
    }, 8000);
  });
});
