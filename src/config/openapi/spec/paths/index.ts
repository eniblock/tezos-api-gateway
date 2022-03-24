import jobs from './jobs';
import users from './user';
import storage from './storage';
import entrypoints from './entrypoints';
import contract from './contract';
import conf from './conf';
import test from './test';
import utils from './utils';
import { prod } from '../../../index';

let paths = {
  ...jobs,
  ...storage,
  ...entrypoints,
  ...users,
  ...contract,
  ...conf,
  ...utils,
};

if (!prod) {
  paths = { ...paths, ...test };
}

export default paths;
