import { logger } from '../../../__fixtures__/services/logger';
import { flexibleTokenContract } from '../../../__fixtures__/smart-contract';
import superagent from 'superagent';
import { IndexerPool } from '../../../../src/services/indexer-pool';
import { IndexerEnum } from '../../../../src/const/interfaces/indexer';
import { IndexerClient } from '../../../../src/services/clients/indexer-client';
import { ContractTransactionsParams } from '../../../../src/const/interfaces/contract/contract-transactions-params';
import { UnsupportedIndexerError } from '../../../../src/const/errors/indexer-error';

describe('[services/clients] Indexer client Service', () => {
  let randomIndexer: IndexerClient;
  let indexerClientTZKT: IndexerClient;
  let indexerClientTzstats: IndexerClient;

  beforeAll(async () => {
    const indexerPool = new IndexerPool(logger);
    await indexerPool.initializeIndexers();
    randomIndexer = indexerPool.getRandomIndexer();
    indexerClientTZKT = indexerPool.getSpecificIndexer(IndexerEnum.TZKT);
    indexerClientTzstats = indexerPool.getSpecificIndexer(IndexerEnum.TZSTATS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getTransactionListOfSC', () => {
    it('should call buildURLForTransactionList and superagent', async () => {
      jest.mock('superagent');
      const superagentSpy = jest.spyOn(superagent, 'get');
      const buildURLSpy = jest.spyOn(
        indexerClientTZKT,
        'buildURLForTransactionList',
      );

      await indexerClientTZKT.getTransactionListOfSC(flexibleTokenContract, {});

      expect(superagentSpy).toHaveBeenCalled();
      expect(buildURLSpy).toHaveBeenCalledWith(flexibleTokenContract, {});
    });
  });

  describe('#buildURLForTransactionList', () => {
    it('should return domain/path and query params', async () => {
      const { domainAndPath, queryParams } =
        randomIndexer.buildURLForTransactionList(flexibleTokenContract, {});

      expect(domainAndPath).toBeDefined();
      expect(queryParams).toBeDefined();
    });

    test('that query params contains limit and offset with default values when params is empty', async () => {
      const { queryParams } = randomIndexer.buildURLForTransactionList(
        flexibleTokenContract,
        {},
      );

      expect(queryParams).toMatch(/^limit=20&offset=0?/);
    });

    test('that query params contains limit and offset when params is not empty', async () => {
      const params: ContractTransactionsParams = {
        order: 'asc',
        entrypoint: 'entrypoint',
      };
      const { queryParams } = randomIndexer.buildURLForTransactionList(
        flexibleTokenContract,
        params,
      );

      expect(queryParams).toMatch(/^limit=20&offset=0?/);
    });

    test('that passed params limit and offset override defaults', () => {
      const params: ContractTransactionsParams = {
        limit: 5,
        offset: 8,
      };

      const { queryParams } = indexerClientTzstats.buildURLForTransactionList(
        flexibleTokenContract,
        params,
      );

      expect(queryParams).toMatch(/^limit=5&offset=8/);
    });

    test('that domainAndPath contains the contract address when tzstats is used', () => {
      const { domainAndPath } = indexerClientTzstats.buildURLForTransactionList(
        flexibleTokenContract,
        {},
      );

      expect(domainAndPath).toMatch(new RegExp(`${flexibleTokenContract}?`));
    });

    test('that all passed params are built when tzstats is used', () => {
      const params: ContractTransactionsParams = {
        order: 'asc',
        entrypoint: 'name',
        limit: 5,
        offset: 8,
      };
      const { queryParams } = indexerClientTzstats.buildURLForTransactionList(
        flexibleTokenContract,
        params,
      );

      expect(queryParams).toEqual('limit=5&offset=8&order=asc&entrypoint=name');
    });

    it('should throw an UnsupportedIndexerError when tzstats is used and parameter is defined', () => {
      const params: ContractTransactionsParams = {
        parameter: '*test',
      };

      const FUT = () =>
        indexerClientTzstats.buildURLForTransactionList(
          flexibleTokenContract,
          params,
        );

      expect(FUT).toThrow(UnsupportedIndexerError);
    });

    test('that all passed params are built when tzkt is used', () => {
      const params: ContractTransactionsParams = {
        order: 'asc',
        entrypoint: 'name',
        limit: 5,
        offset: 8,
        parameter: '*test',
      };
      const { domainAndPath, queryParams } =
        indexerClientTZKT.buildURLForTransactionList(
          flexibleTokenContract,
          params,
        );

      expect(domainAndPath).toEqual(
        'https://api.ghostnet.tzkt.io/v1/operations/transactions/',
      );
      expect(queryParams).toEqual(
        `limit=5&offset=8&target.eq=${flexibleTokenContract}&sort.asc=id&entrypoint.eq=name&parameter.as=*test`,
      );
    });
  });
});
