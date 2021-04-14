import { GenericObject } from './forge-operation-params';

export interface DeepLayerDataField {
  key: string | GenericObject;
  dataFields?: ContractStorageRequestDataField[];
}

export type ContractStorageRequestDataField =
  | string
  | { [key: string]: DeepLayerDataField[] };
