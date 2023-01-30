import { ContractResponse } from '@taquito/rpc';

import { TezosService } from '../../../../src/services/tezos';
import { ForgeOperationParams } from '../../../../src/const/interfaces/forge-operation-params';
import { AddressNotFoundError } from '../../../../src/const/errors/address-not-found-error';
import {
  InvalidMapStructureParams,
  MissingParameter,
} from '../../../../src/const/errors/invalid-entry-point-params';

import { tezosNodeUrl } from '../../../__fixtures__/config';
import {
  activatedAccount,
  FA2Contract,
  flexibleTokenContract,
  revealedAccount,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';
import { AddressNotRevealedError } from '../../../../src/const/errors/address-not-revealed';
import { MaxOperationsPerBatchError } from '../../../../src/const/errors/max-operations-per-batch-error';
import { estimateOperation } from '../../../../src/lib/jobs/estimate-operation';

describe('[lib/jobs/estimate-operation]', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#estimateOperation', () => {
    const testTransaction = {
      contractAddress: flexibleTokenContract,
      entryPoint: 'transfer',
      entryPointParams: {
        tokens: 1,
        destination: testAccount2,
      },
    };
    const testForgeOperation: ForgeOperationParams = {
      transactions: [
        testTransaction,
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'lock',
        },
      ],
      publicKey: '',
      sourceAddress: revealedAccount.address,
      useCache: true,
      reveal: false,
    };
    const estimationResults = [
      {
        amount: 0,
        counter: 10240873,
        destination: flexibleTokenContract,
        gasEstimation: 2706,
        gasLimit: 2806,
        kind: 'transaction',
        minimalFee: 490,
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
        suggestedFee: 590,
      },
      {
        amount: 0,
        counter: 10240874,
        destination: flexibleTokenContract,
        gasEstimation: 1215,
        gasLimit: 1315,
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

    it('should throw AddressNotFoundError when source address is not correct (no counter in the response)', async () => {
      jest
        .spyOn(tezosService, 'getContractResponse')
        .mockResolvedValue({} as unknown as ContractResponse);
      await expect(
        estimateOperation(testForgeOperation, tezosService),
      ).rejects.toThrowError(AddressNotFoundError);
    });

    it('should throw MissingParameter when an entry point parameter is missing', async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
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
          },
          tezosService,
        ),
      ).rejects.toThrowError(MissingParameter);
    });

    it('should throw InvalidMapStructureParams when entry point parameters does not match entry schema', async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
            transactions: [
              {
                contractAddress: FA2Contract,
                entryPoint: 'mint',
                entryPointParams: {
                  amount: 100,
                  address: testAccount,
                  token_id: 1,
                  metadata: {
                    key: 'name',
                    value: '54686520546f6b656e204f6e65',
                  },
                },
              },
            ],
          },
          tezosService,
        ),
      ).rejects.toThrowError(InvalidMapStructureParams);
    });

    it('should throw AddressNotRevealedError when reveal is false and the address is not revealed', async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
            sourceAddress: activatedAccount.address,
            reveal: false,
          },
          tezosService,
        ),
      ).rejects.toThrowError(AddressNotRevealedError);
    });

    it("should throw AddressNotRevealedError when reveal is true and the address isn't related to the publicKey", async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
            sourceAddress: activatedAccount.address,
            publicKey: revealedAccount.publicKey,
            reveal: true,
          },
          tezosService,
        ),
      ).rejects.toThrowError(AddressNotRevealedError);
    });

    it('should throw MaxOperationsPerBatchError when number of transactions is 5 and reveal is needed', async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
            transactions: [
              testTransaction,
              testTransaction,
              testTransaction,
              testTransaction,
              testTransaction,
            ],
            sourceAddress: activatedAccount.address,
            publicKey: activatedAccount.publicKey,
            reveal: true,
          },
          tezosService,
        ),
      ).rejects.toThrowError(MaxOperationsPerBatchError);
    });

    it('should throw the error when the error happen', async () => {
      await expect(
        estimateOperation(
          {
            ...testForgeOperation,
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  tokens: 'this is a token',
                  destination: testAccount2,
                },
              },
            ],
          },
          tezosService,
        ),
      ).rejects.toHaveProperty('name', 'NatValidationError');
    });

    it('should correctly return estimations', async () => {
      const estimations = await estimateOperation(
        testForgeOperation,
        tezosService,
      );
      expect(estimations).toEqual(estimationResults);
    }, 8000);

    it('should correctly return estimations when reveal is true and the address is already revealed', async () => {
      const estimations = await estimateOperation(
        {
          ...testForgeOperation,
          reveal: true,
          publicKey: revealedAccount.publicKey,
        },
        tezosService,
      );
      expect(estimations).toEqual(estimationResults);
    });

    it('should correctly and include the reveal operation estimation is true and the address is not revealed', async () => {
      const estimations = await estimateOperation(
        {
          ...testForgeOperation,
          reveal: true,
          sourceAddress: activatedAccount.address,
          publicKey: activatedAccount.publicKey,
        },
        tezosService,
      );
      expect(estimations[0]).toEqual({
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
      });
    });

    it('should correctly return estimations when amount is specified', async () => {
      testForgeOperation.transactions[0].amount = 10;
      testForgeOperation.transactions[1].amount = 100;
      const estimations = await estimateOperation(
        testForgeOperation,
        tezosService,
      );
      expect(estimations).toEqual([
        {
          ...estimationResults[0],
          amount: 10,
          minimalFee: 493,
          suggestedFee: 593,
        },
        {
          ...estimationResults[1],
          amount: 100,
          minimalFee: 343,
          suggestedFee: 443,
        },
      ]);
    }, 8000);
  });
});
