import { IndexerEnum } from '../../const/interfaces/indexer';
import { UnsupportedIndexerError } from '../../const/errors/indexer-error';
import { IndexerTransaction } from '../../const/interfaces/transaction';
import { deleteObjectSubLevel } from '../filter-object';

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
        indexer: IndexerEnum.TZSTATS,
        destination: rawTx.receiver,
        source: rawTx.sender,
        timestamp: rawTx.time,
        status: rawTx.status,
        baker_fee: rawTx.fee,
        storage_fee: rawTx.burned || 0,
        storage_limit: rawTx.storage_limit || 0,
        counter: rawTx.counter,
        hash: rawTx.hash,
        block: rawTx.block,
        type: rawTx.type,
        height: rawTx.height,
        entrypoint: rawTx.parameters?.entrypoint,
        parameters: deleteObjectSubLevel(rawTx.parameters?.value || '', [
          '@or_0',
          '@or_1',
        ]),
        amount: rawTx.volume || 0,
      };
    case IndexerEnum.TZKT:
      return {
        indexer: IndexerEnum.TZKT,
        destination: rawTx.target.address,
        source: rawTx.sender.address,
        timestamp: rawTx.timestamp,
        status: rawTx.status,
        baker_fee: rawTx.bakerFee / 1000000,
        storage_fee: rawTx.storageFee / 1000000,
        storage_limit: rawTx.storageLimit || 0,
        counter: rawTx.counter,
        hash: rawTx.hash,
        block: rawTx.block,
        type: rawTx.type,
        height: rawTx.level,
        entrypoint: rawTx.parameter?.entrypoint,
        parameters: rawTx.parameter?.value,
        amount: rawTx.amount / 1000000 || 0,
      };
    default:
      throw new UnsupportedIndexerError(indexerName);
  }
}
