import bunyan, { LogLevel } from 'bunyan';
import { loggerConfig } from '../config';

export function createLogger(config: { name: string; level: string }) {
  return bunyan.createLogger({
    name: config.name, // logger name
    serializers: {
      req: bunyan.stdSerializers.req, // standard bunyan req serializer
      err: bunyan.stdSerializers.err, // standard bunyan error serializer
    },
    streams: [
      {
        level: config.level as LogLevel, // loging level
        stream: process.stdout, // log INFO and above to stdout
      },
    ],
  });
}
export const logger = createLogger(loggerConfig);
