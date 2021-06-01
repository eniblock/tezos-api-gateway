import { InjectionConsumerProcess } from './injection-consumer-process';
import { createLogger } from '../../../services/logger';
import { injectionWorkerLoggerConfig } from './config';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/metrics';

if (!module.parent) {
  // Add your port and startServer to the Prometheus options
  const options = { port: 9466, startServer: true };
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

  const logger = createLogger(injectionWorkerLoggerConfig);

  const injectionConsumerProcess = new InjectionConsumerProcess(logger);

  injectionConsumerProcess.spawn();
}
