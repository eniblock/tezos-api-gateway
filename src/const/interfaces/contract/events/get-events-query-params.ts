export interface GetEventsQueryParams {
  contract?: string;
  order?: string;
  tag?: string;
  blockLevel?: number;
  operationHash?: string;
  indexer?: string;
  limit?: number;
  offset?: number;
}
