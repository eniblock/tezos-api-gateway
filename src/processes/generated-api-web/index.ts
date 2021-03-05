import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/metrics';

// Add your port and startServer to the Prometheus options
const options = { port: 9464, startServer: true };
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

import { WebProcess } from './web-process';
import { serverConfig } from '../../config';

if (!module.parent) {
  const webProcess = new WebProcess({ server: serverConfig });
  webProcess.spawn();
}
