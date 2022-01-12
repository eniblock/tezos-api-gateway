import { createLogger } from '../../../services/logger';
import { loggerConfig } from './config';
import { CheckOperationStatusProcess } from './check-operation-status-process';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/metrics';

// Add your port and startServer to the Prometheus options
const options = { port: 9465, startServer: true };
const exporter = new PrometheusExporter(options);

// Register the exporter
const meter = new MeterProvider({
  exporter,
  interval: 1000,
}).getMeter('example-prometheus');

const counter = meter.createCounter('metric_name', {
  description: 'Example of a counter',
});
counter.bind({ pid: process.pid.toString() });

const logger = createLogger(loggerConfig);

const checkOperationStatus = new CheckOperationStatusProcess(logger);
checkOperationStatus.spawn();
