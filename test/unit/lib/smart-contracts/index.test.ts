import {
  ContractAbstraction,
  ContractProvider,
  MichelsonMap,
} from '@taquito/taquito';

import { TestContractMethod } from '../../../__fixtures__/contract-method';
import { logger } from '../../../__fixtures__/services/logger';

import {
  getContractMethod,
  getTransferToParams,
} from '../../../../src/lib/smart-contracts';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../src/const/errors/invalid-entry-point-params';

describe('[lib/smartContracts]', () => {
  describe('#getContractMethod', () => {
    const testContractMethod = new TestContractMethod();
    let method: jest.Mock;

    let contract: ContractAbstraction<ContractProvider>;

    beforeEach(() => {
      method = jest.fn().mockImplementation(() => testContractMethod);

      contract = ({
        methods: {
          transfer: method,
        },
      } as unknown) as ContractAbstraction<ContractProvider>;

      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: 'nat',
        destination: 'address',
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return the test contract method', () => {
      expect(
        getContractMethod(logger, contract, 'transfer', {
          destination: 'fake_destination',
          tokens: 10,
        }),
      ).toEqual(testContractMethod);

      expect(method).toHaveBeenNthCalledWith(2, 10, 'fake_destination');
    });

    it('should return the method correctly when params is empty', () => {
      expect(getContractMethod(logger, contract, 'transfer')).toEqual(
        testContractMethod,
      );

      expect(method.mock.calls).toEqual([[0]]);
    });

    it('should return the method correctly when params is not an object', () => {
      expect(getContractMethod(logger, contract, 'transfer', 'toto')).toEqual(
        testContractMethod,
      );

      expect(method.mock.calls).toEqual([['toto']]);
    });

    it('should return the method correctly when params is an array', () => {
      expect(getContractMethod(logger, contract, 'transfer', ['toto'])).toEqual(
        testContractMethod,
      );

      expect(method.mock.calls).toEqual([[['toto']]]);
    });

    it('should correctly form a Michelson Map if there is a map in the schema', () => {
      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: {
          map: {
            key: 'string',
            value: 'address',
          },
        },
      });

      expect(
        getContractMethod(logger, contract, 'transfer', {
          tokens: [{ key: 'toto', value: 'tata' }],
        }),
      ).toEqual(testContractMethod);

      const map = MichelsonMap.fromLiteral({ toto: 'tata' });

      expect(method).toHaveBeenNthCalledWith(2, map);
    });

    it('should throw InvalidEntryPointParams when the entry point params does not match the entry point schema', () => {
      expect(() =>
        getContractMethod(
          logger,
          (contract as unknown) as ContractAbstraction<ContractProvider>,
          'transfer',
          {
            destination: 'fake_destination',
            fake_tokens: 10,
          },
        ),
      ).toThrow(InvalidEntryPointParams);
    });

    it('should throw InvalidMapStructureParams when the parameter which should be a map is not an array', () => {
      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: {
          map: {
            key: 'string',
            value: 'address',
          },
        },
      });

      expect(() =>
        getContractMethod(logger, contract, 'transfer', {
          tokens: { key: 'toto', value: 'tata' },
        }),
      ).toThrow(InvalidMapStructureParams);
    });

    it('should throw InvalidMapStructureParams when the parameter which should be a map does not match the map structure', () => {
      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: {
          map: {
            key: 'string',
            value: 'address',
          },
        },
      });

      expect(() =>
        getContractMethod(logger, contract, 'transfer', {
          tokens: [{ toto: 'tata' }],
        }),
      ).toThrow(InvalidMapStructureParams);
    });
  });

  describe('#getTransferToParams', () => {
    const testContractMethod = new TestContractMethod();
    let method: jest.Mock;

    let contract: ContractAbstraction<ContractProvider>;

    beforeEach(() => {
      method = jest.fn().mockImplementation(() => testContractMethod);

      contract = ({
        methods: {
          transfer: method,
        },
      } as unknown) as ContractAbstraction<ContractProvider>;

      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: 'nat',
        destination: 'address',
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should call test contract method with a correct arguments', () => {
      expect(
        getTransferToParams(logger, contract, 'transfer', {
          destination: 'fake_destination',
          tokens: 10,
        }),
      ).toEqual('toTransferParams');

      expect(method).toHaveBeenNthCalledWith(2, 10, 'fake_destination');
    });

    it('should throw InvalidEntryPointParams when the entry point params does not match the entry point schema', () => {
      expect(() =>
        getTransferToParams(
          logger,
          (contract as unknown) as ContractAbstraction<ContractProvider>,
          'transfer',
          {
            destination: 'fake_destination',
            fake_tokens: 10,
          },
        ),
      ).toThrow(InvalidEntryPointParams);
    });
  });
});
