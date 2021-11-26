import { JobStatus } from '../job-status';

export interface Jobs {
  id: number;
  operation_kind?: string;
  forged_operation?: string;
  operation_hash?: string;
  status: JobStatus;
}
