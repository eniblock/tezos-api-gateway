import { JobStatus } from '../job-status';

export interface Jobs {
  id: number;
  raw_transaction?: string;
  operation_hash?: string;
  status: JobStatus;
}
