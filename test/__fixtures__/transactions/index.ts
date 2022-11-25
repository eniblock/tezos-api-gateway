import { IndexerEnum } from '../../../src/const/interfaces/indexer';
import {
  flexibleTokenContract,
  revealedAccount,
  testAccount,
} from '../smart-contract';
export const firstTx = {
  baker_fee: 0.2,
  block: 'BM1sYMLUVrpSVBzpdtzwtYSXkUsZLrpi2k2teYjy1ACfUxu7nvb',
  counter: 10240854,
  destination: flexibleTokenContract,
  entrypoint: 'transfer',
  hash: 'opNH9hXDU5tRfkuqQBjAsEizNWV71QJqZnY2bx6UJ2Zj9qC6zZF',
  height: 961974,
  indexer: IndexerEnum.TZKT,
  parameters: {
    destination: testAccount,
    tokens: '0',
  },
  source: revealedAccount.address,
  status: 'applied',
  storage_fee: 0,
  storage_limit: 50000,
  timestamp: '2022-08-04T14:12:00Z',
  type: 'transaction',
  amount: 0,
};
export const contractWithTezBalance = 'KT1NvPCUreZQvhVTHYVvAfSYMTiCPjYzu8e8';
export const tezTransferTransactions = [
  {
    destination: contractWithTezBalance,
    source: 'tz1fwKAB7wY37zZ71qLeScSk5X5PVZdTczoS',
    timestamp: '2022-11-25T10:34:30Z',
    status: 'applied',
    baker_fee: 0.00142,
    storage_fee: 0,
    storage_limit: 496,
    counter: 11402135,
    hash: 'opJeFd3ubfWynWpjtu1qN5vFqWLcqZzvH5ngxUA1jsLHiSUNLVX',
    block: 'BKk4N8LqkhQYfLkmxmm3yiR9eZDdfuZmhtgZsGNkaNTA93cKP7H',
    type: 'transaction',
    height: 1558557,
    amount: 13,
  },
  {
    destination: contractWithTezBalance,
    source: 'tz1dAbb66qRJndGMD4KKDxzBebQursit5pfT',
    timestamp: '2022-11-25T11:26:30Z',
    status: 'applied',
    baker_fee: 0.000421,
    storage_fee: 0,
    storage_limit: 0,
    counter: 10240820,
    hash: 'opNB5bFeRGefGVi1XqYHq2bo3HaDyygvF85f9VbGFXZqcBrEPTu',
    block: 'BLnKBxJVHXjKDoktZe7jtuMPZZAhP4jgtgdL5A1En3ZMjPuBeES',
    type: 'transaction',
    height: 1558753,
    amount: 0.001,
  },
];

export const failedTx = {
  hash: 'opRaqsDcCbHTUepcfMsYwLp1tGRLvAVuNomHUu9syETeE7wQesN',
  errors: [
    {
      id: 'proto.014-PtKathma.michelson_v1.runtime_error',
      kind: 'temporary',
      contract_handle: 'KT1MCPemFmjPP7G1F7GhgUcNKDyD6hYdy638',
    },
    {
      id: 'proto.014-PtKathma.michelson_v1.script_rejected',
      kind: 'temporary',
      location: 1369,
      with: { string: 'INVALID_AUCTION_ID' },
    },
  ],
};
