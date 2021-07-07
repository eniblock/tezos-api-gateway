import { WebProcess } from './web-process';
import { serverConfig } from '../../config';

if (!module.parent) {
  const webProcess = new WebProcess({ server: serverConfig });
  webProcess.spawn();
}
