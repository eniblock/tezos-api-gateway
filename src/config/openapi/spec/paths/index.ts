import jobs from './jobs';
import users from './user';
import storage from './storage';
import entrypoints from './entrypoints';
import contract from './contract';
import conf from './conf';

export const paths = {
  ...jobs,
  ...storage,
  ...entrypoints,
  ...users,
  ...contract,
  ...conf,
};

export default paths;
