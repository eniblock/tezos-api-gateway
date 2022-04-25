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
  baker_fee: 0.000829,
  block: 'BLhVTe8x1g9hTViwnCmcJoJ2NAjoWqL4sCa9xGyrDXNeH1xPtQN',
  counter: 10240821,
  destination: flexibleTokenContract,
  entrypoint: 'transfer',
  hash: 'onzemPP7b9MJ8yg59m4Gfsm9ALegQ3aMvik52EgP4cphPBjscUz',
  height: 422112,
  indexer: 'tzkt',
  parameters: {
    destination: testAccount,
    tokens: '0',
  },
  source: revealedAccount.address,
  status: 'applied',
  storage_fee: 0,
  storage_limit: 0,
  timestamp: '2022-04-21T13:39:30Z',
  type: 'transaction',
};
