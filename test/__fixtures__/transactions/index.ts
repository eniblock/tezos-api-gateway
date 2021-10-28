import { IndexerEnum } from '../../../src/const/interfaces/indexer';
export const originationOp = {
  indexer: IndexerEnum.TZSTATS,
  destination: 'KT1PC7JUBQQXawknSuZrkEvsphG7n55QNpEv',
  source: 'tz1QdgwqsVV7SmpFPrWjs9B5oBNcj2brzqfG',
  timestamp: '2021-10-21T08:32:39Z',
  status: 'applied',
  baker_fee: 0.003649,
  storage_fee: 0.8535,
  storage_limit: 3414,
  counter: 365115,
  hash: 'onvByVBBjEQhYHnT72wy1wMDmp4Hznj5i1T7QU6wjjTEraWbwN8',
  block: 'BLR39HJGPvpsVGSkVKuppXP4rZCR4oBoEzfjoXjo2aXmaZbrx9C',
  type: 'origination',
  height: 597774,
  parameters: '',
  entrypoint: undefined,
};

export const firstTx = {
  destination: 'KT1PC7JUBQQXawknSuZrkEvsphG7n55QNpEv',
  source: 'tz1QdgwqsVV7SmpFPrWjs9B5oBNcj2brzqfG',
  timestamp: '2021-10-21T16:24:19Z',
  status: 'applied',
  baker_fee: 0.000839,
  storage_fee: 0.01675,
  storage_limit: 67,
  counter: 365117,
  hash: 'onefEAXu4hq9JHxJRM47rvHmkiVf3SYRe9M7PnNgvjhrRvza8UN',
  block: 'BMaCpTdnbCzUcQhXgL9FQUJwkdzvgzxmLG4Hyzac882FTMir8jT',
  type: 'transaction',
  height: 599142,
  entrypoint: 'transfer',
  parameters: {
    destination: 'tz1MPQBaR1r4hKveeCnNYPExnme5KBpbkWUP',
    tokens: '5',
  },
};
