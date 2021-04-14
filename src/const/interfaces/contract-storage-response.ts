import { MichelsonMapKey } from '@taquito/michelson-encoder/dist/types/michelson-map';

export enum ContractStorageDataType {
  BIG_MAP = 'big_map',
  MAP = 'map',
  ADDRESS = 'address',
  NATURAL_NUMBER = 'natural_number',
  INTEGER = 'integer',
  STRING = 'string',
}

export interface ContractStorageResponseValue {
  type: ContractStorageDataType;
  value: unknown;
  size?: number;
}

export interface ContractStorageResponse {
  [key: string]: ContractStorageResponseValue | string | number | boolean;
}

export interface MapObject {
  key: MichelsonMapKey;
  value: unknown;
}
