import { IndexerEnum } from '../../const/interfaces/indexer';
import { EventsResult } from '../../const/interfaces/contract/events/events-result';

/**
 * Convert the contract/events result returned by Tzkt indexer to EventsResult interface
 *
 * @param eventsResult
 * @param operationHash
 * @return {object} the contract events
 */

export function mapTzktContractEvents(eventsResult: any): EventsResult {
  return {
    indexer: IndexerEnum.TZKT,
    contract: eventsResult.contract?.address,
    tag: eventsResult.tag,
    payload: eventsResult.payload,
    timestamp: eventsResult.timestamp,
  };
}
