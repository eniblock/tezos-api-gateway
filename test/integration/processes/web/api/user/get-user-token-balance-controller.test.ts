import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import supertest from 'supertest';
import nock from 'nock';
import {
  activatedAccount,
  unActivatedAccount,
} from '../../../../../__fixtures__/smart-contract';
import { resetTable } from '../../../../../__utils__/postgre';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import {
  tokenFa12,
  tokenFA2FT,
  tokenFA2NFT1,
  tokenFA2NFT2,
  tokenFA2NFT3,
} from '../../../../../__fixtures__/tokens';

describe('[processes/web/api/user/info] Get Token Balance controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
    await webProcess.amqpService.channel.waitForConnect();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#getUserTokenBalance', () => {
    it('Should return 404 when a required parameter is missing', async () => {
      const { body, status } = await request.get('/api/user/token-balance/');

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'not found',
        status: 404,
      });
    });

    it('Should return 400 when the account address does not have a good format', async () => {
      const { body, status } = await request.get(
        '/api/user/token-balance/fakeFormat',
      );

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.params.account should match pattern "^tz+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('should return 200 and the token balance list', async () => {
      const { body, status } = await request.get(
        `/api/user/token-balance/${activatedAccount.address}`,
      );

      expect(body).toEqual([
        tokenFA2FT,
        tokenFA2NFT1,
        tokenFA2NFT2,
        tokenFA2NFT3,
        tokenFa12,
      ]);
      expect(status).toEqual(200);
    });

    it('should return 200 and the token balance list if the account is a contract', async () => {
      const { body, status } = await request.get(
        `/api/user/token-balance/KT19tyXiSuMGV36B2F6q1oYjchFx3p4ndBdz`,
      );

      expect(status).toEqual(200);
      expect(body.length).toEqual(2);
    });

    it('Should return 200 when the address does not exist', async () => {
      const { body, status } = await request.get(
        `/api/user/token-balance/${unActivatedAccount.address}`,
      );

      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should return 200 and only fa2 tokens when standard query param is set to "fa2"', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ standard: 'fa2' });

      expect(body).toEqual([
        tokenFA2FT,
        tokenFA2NFT1,
        tokenFA2NFT2,
        tokenFA2NFT3,
      ]);
      expect(status).toEqual(200);
    });

    it('should return 200 and only fa1.2 tokens when standard query param is set to "fa1.2"', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ standard: 'fa1.2' });

      expect(body).toEqual([tokenFa12]);
      expect(status).toEqual(200);
    });

    it('should return 200 and only tokens of a the smart contract set in query param "contract"', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ contract: tokenFA2FT.token.contract });

      expect(body).toEqual([tokenFA2FT]);
      expect(status).toEqual(200);
    });

    it('should return 200 and not more than one token if query parameters "contract" and "tokenId" are set', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ contract: tokenFA2NFT2.token.contract, tokenId: 1 });

      expect(body).toEqual([tokenFA2NFT2]);
      expect(status).toEqual(200);
    });

    it('should return 200 and only fa2 tokens with a balance 1 when the balance query param is set to 1', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({
          balance: 1,
        });

      expect(body).toEqual([tokenFA2NFT1, tokenFA2NFT2, tokenFA2NFT3]);
      expect(status).toEqual(200);
    });

    it('should use return the correct number of tokens when query param limit is set', async () => {
      const { body, status } = await request.get(
        `/api/user/token-balance/${activatedAccount.address}?`,
      );
      expect(status).toEqual(200);
      expect(body.length).toEqual(5);

      const { body: body2, status: status2 } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ limit: 2 });
      expect(status2).toEqual(200);
      expect(body2.length).toEqual(2);
    });

    it('should use return the correct tokens when query param offset is set', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ offset: 2 });
      expect(status).toEqual(200);
      expect(body).toEqual([tokenFA2NFT2, tokenFA2NFT3, tokenFa12]);
    });

    it('should invert tokens order when query param order is set to "desc"', async () => {
      const { body, status } = await request
        .get(`/api/user/token-balance/${activatedAccount.address}`)
        .query({ order: 'desc' });
      expect(status).toEqual(200);
      expect(body).toEqual([
        tokenFa12,
        tokenFA2NFT3,
        tokenFA2NFT2,
        tokenFA2NFT1,
        tokenFA2FT,
      ]);
    });
  });
});
