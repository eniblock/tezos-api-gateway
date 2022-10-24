import { IndexerEnum } from '../../../src/const/interfaces/indexer';
import {
  flexibleTokenContract,
  revealedAccount,
  testAccount,
} from '../smart-contract';
export const originationOp = {
  indexer: IndexerEnum.TZSTATS,
  destination: 'KT1GYQn8mwSLypyHNPo8d9D151UC8tdo39xR',
  source: 'tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z',
  timestamp: '2021-12-07T09:52:15Z',
  status: 'applied',
  baker_fee: 0.002814,
  storage_fee: 0.6425,
  storage_limit: 2570,
  counter: 2607269,
  hash: 'opQ6NJpBrArif2Ls9ajpaXciULzo5cFru8DPXFH3UAmubi93irY',
  block: 'BMaSYNHvVFkPJTqJjv9fpDB8NPT5sX9BqYZSPTsx4XGvnN6tC7X',
  type: 'origination',
  height: 157089,
  parameters: {},
  entrypoint: undefined,
};

export const firstTx = {
  baker_fee: 0.2,
  block: 'BM1sYMLUVrpSVBzpdtzwtYSXkUsZLrpi2k2teYjy1ACfUxu7nvb',
  counter: 10240854,
  destination: flexibleTokenContract,
  entrypoint: 'transfer',
  hash: 'opNH9hXDU5tRfkuqQBjAsEizNWV71QJqZnY2bx6UJ2Zj9qC6zZF',
  height: 961974,
  indexer: 'tzkt',
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
};

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
