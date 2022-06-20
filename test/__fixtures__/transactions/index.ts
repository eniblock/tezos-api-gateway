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
  baker_fee: 0.000628,
  block: 'BL8HMatjGuGXmhHLqKHnomyVrLM14FRBeePJtqWRcpmqwkBoMWP',
  counter: 293364,
  destination: flexibleTokenContract,
  entrypoint: 'transfer',
  hash: 'ookxXc2qFf9EpaXT7eMfapybiJ9oGPQjp6sgs1SzXGrjuSakLRP',
  height: 263228,
  indexer: 'tzkt',
  parameters: {
    destination: testAccount,
    tokens: '0',
  },
  source: revealedAccount.address,
  status: 'applied',
  storage_fee: 0,
  storage_limit: 0,
  timestamp: '2022-06-14T12:33:45Z',
  type: 'transaction',
};
