import { IndexerEnum } from '../interfaces/indexer';
import { UnsupportedIndexerError } from '../errors/indexer-error';
import { IndexerTransaction } from '../interfaces/transaction';

/**
 * Convert the transaction returned by any indexer to our IndexerTransaction interface
 *
 * @param {object} rawTx      - the raw transaction coming from the indexer
 * @param {string} indexer    - the indexer that returned the transaction
 *
 * @return {object} the transaction
 */

export function mapIndexerTransactionToTransaction(
  rawTx: any,
  indexerName: IndexerEnum,
): IndexerTransaction {
  switch (indexerName) {
    case IndexerEnum.TZSTATS:
      return {
        destination: rawTx.receiver,
        source: rawTx.sender,
        timestamp: rawTx.time,
        status: rawTx.status,
        fee: rawTx.fee,
        storage_limit: rawTx.storage_limit,
        counter: rawTx.counter,
        hash: rawTx.hash,
        block: rawTx.block,
        type: rawTx.type,
        height: rawTx.height,
        entrypoint: rawTx.entrypoint,
      };
    case IndexerEnum.TZKT:
      return {
        destination: rawTx.target.address,
        source: rawTx.sender.address,
        timestamp: rawTx.timestamp,
        status: rawTx.status,
        fee: rawTx.storageFee,
        storage_limit: rawTx.storageLimit,
        counter: rawTx.counter,
        hash: rawTx.hash,
        block: rawTx.block,
        type: rawTx.type,
        height: rawTx.level,
        entrypoint: rawTx.parameter.entrypoint,
      };
    default:
      throw new UnsupportedIndexerError(indexerName);
      break;
  }
}
