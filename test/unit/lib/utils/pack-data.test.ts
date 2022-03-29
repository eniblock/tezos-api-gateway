import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeUrl } from '../../../__fixtures__/config';
import { packData } from '../../../../src/lib/utils/pack-data';
import { InvalidMapStructureParams } from '../../../../src/const/errors/invalid-entry-point-params';

describe('[lib/utils/pack-data]', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  it('should correctly pack Pair object', async () => {
    const packDataParams = {
      data: {
        delegated_address: 'tz1W5ubDUJwpd9Gb94V2YKnZBHggAMMxtbBd',
        expiration_date: '1652437067',
        paying_address: 'tz1ZRraEmkupRpEhwaJwb58nysXTScXcvGYe',
      },
      type: {
        prim: 'pair',
        args: [
          { prim: 'address', annots: ['%delegated_address'] },
          {
            prim: 'pair',
            args: [
              { prim: 'timestamp', annots: ['%expiration_date'] },
              { prim: 'address', annots: ['%paying_address'] },
            ],
          },
        ],
      },
    };
    const packedData = await packData(tezosService, packDataParams);

    await expect(packedData).toEqual(
      '0507070a00000016000072962502e07fb0735e918f3d84c996733c01be2e0707008bc1f1a70c0a000000160000974452a440a4cfe60d550ec6cbb880bbd21f6613',
    );
  });

  it('should correctly pack Pair object with maps included', async () => {
    const packDataParams = {
      data: {
        nft_contract_address: 'KT1XdNLRwUhEnzYRJW8WZAUKcpupDFc7jerp',
        nft_id: 1,
        royalties: {
          decimals: 2,
          shares: [
            {
              key: 'tz1WxrQuZ4CK1MBUa2GqUWK1yJ4J6EtG1Gwi',
              value: 5,
            },
            {
              key: 'tz1g7KBruSWP7JERBRhKgJzezPqs4ZBDkR5B',
              value: 10,
            },
          ],
        },
      },
      type: {
        prim: 'pair',
        args: [
          { prim: 'address', annots: ['%nft_contract_address'] },
          {
            prim: 'pair',
            args: [
              { prim: 'int', annots: ['%nft_id'] },
              {
                prim: 'pair',
                args: [
                  { prim: 'int', annots: ['%decimals'] },
                  {
                    prim: 'map',
                    args: [{ prim: 'address' }, { prim: 'int' }],
                    annots: ['%shares'],
                  },
                ],
                annots: ['%royalties'],
              },
            ],
          },
        ],
      },
    };
    const packedData = await packData(tezosService, packDataParams);

    await expect(packedData).toEqual(
      '0507070a0000001601fcc8bfe353d8b099e0e6e675b4e2e4e925050ef1000707000107070002020000003e07040a0000001600007c38b4bb43c4340b9e33ab837130c63223aa9fd7000507040a000000160000e08b843540b7e1725f99ba5dc993af6fa7e9804a000a',
    );
  });

  it('should correctly pack strings', async () => {
    const packDataParams = {
      data: 'tz1W5ubDUJwpd9Gb94V2YKnZBHggAMMxtbBd',
      type: {
        prim: 'address',
      },
    };
    const packedData = await packData(tezosService, packDataParams);

    await expect(packedData).toEqual(
      '050a00000016000072962502e07fb0735e918f3d84c996733c01be2e',
    );
  });

  it('should throw AddressNotFoundError when source address is not correct (no counter in the response)', async () => {
    const packDataParams = {
      data: {
        delegated_address: 'tz1W5ubDUJwpd9Gb94V2YKnZBHggAMMxtbBd',
        expiration_date: '1652437067',
      },
      type: {
        prim: 'pair',
        args: [
          { prim: 'address', annots: ['%delegated_address'] },
          {
            prim: 'pair',
            args: [
              { prim: 'timestamp', annots: ['%expiration_date'] },
              { prim: 'address', annots: ['%paying_address'] },
            ],
          },
        ],
      },
    };
    await expect(packData(tezosService, packDataParams)).rejects.toHaveProperty(
      'name',
      'AddressValidationError',
    );
    await expect(packData(tezosService, packDataParams)).rejects.toHaveProperty(
      'message',
      '[paying_address] Address is not valid: undefined',
    );
  });

  it('should throw InvalidMapStructureParams maps are badly structured', async () => {
    const packDataParams = {
      data: {
        nft_id: 1,
        royalties: {
          key: 'tz1WxrQuZ4CK1MBUa2GqUWK1yJ4J6EtG1Gwi',
          value: 5,
        },
      },
      type: {
        prim: 'pair',
        args: [
          { prim: 'int', annots: ['%nft_id'] },
          {
            prim: 'map',
            args: [{ prim: 'address' }, { prim: 'int' }],
            annots: ['%royalties'],
          },
        ],
      },
    };
    await expect(packData(tezosService, packDataParams)).rejects.toThrowError(
      InvalidMapStructureParams,
    );
  });
});
