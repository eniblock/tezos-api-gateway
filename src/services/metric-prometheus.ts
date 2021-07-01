import { MetricConfig } from '../const/interfaces/metric-config';
import { metricConfig } from '../config';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Meter, MeterProvider } from '@opentelemetry/metrics';
import { Counter } from '@opentelemetry/api-metrics';

export class MetricPrometheusService {
  private _exporter: PrometheusExporter;
  private _meter: Meter;
  private _entryPointCounter: Counter;

  constructor(config: MetricConfig = metricConfig) {
    this._exporter = new PrometheusExporter({
      port: config.port,
      preventServerStart: config.preventServerStart,
    });
    this._meter = new MeterProvider({
      exporter: this._exporter,
      interval: config.interval,
    }).getMeter(config.meterName);

    this._entryPointCounter = this._meter.createCounter('entry_point_call', {
      description:
        'This metric will count the number of calls for an entry point per smart contract address',
    });
    this._entryPointCounter.bind({ pid: process.pid.toString() });
  }

  public get entryPointCounter(): Counter {
    return this._entryPointCounter;
  }
}
