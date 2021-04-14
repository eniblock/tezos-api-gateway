import { createLogger } from '../../../src/services/logger';
import { loggerConfig } from '../../../src/config';

export const logger = createLogger({ ...loggerConfig, name: 'test' });
