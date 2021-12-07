import { IndexerEnum } from '../../../src/const/interfaces/indexer';
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
  parameters: '',
  entrypoint: undefined,
};

export const firstTx = {
  destination: 'KT1GYQn8mwSLypyHNPo8d9D151UC8tdo39xR',
  source: 'tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z',
  timestamp: '2021-12-07T10:06:34Z',
  status: 'applied',
  baker_fee: 0.2,
  storage_fee: 0,
  storage_limit: 1000,
  counter: 2607270,
  hash: 'opQAaDdjoWQF2Y4D8batusuPDEvqdMZgwKqXCYju7y3Jd7sQEu7',
  block: 'BLD5xTPgbyc1Gip4YF8cCixhRKNFGkgDzNtVus4ANJQFdg5sP29',
  type: 'transaction',
  height: 157141,
  entrypoint: 'transfer',
  parameters: {
    destination: 'tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z',
    tokens: '5',
  },
};
