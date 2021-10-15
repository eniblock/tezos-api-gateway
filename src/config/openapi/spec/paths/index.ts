import jobs from './jobs';
import users from './user';
import storage from './storage';
import entrypoints from './entrypoints';
import contract from './contract';

export const paths = {
  ...jobs,
  ...storage,
  ...entrypoints,
  ...users,
  ...contract,
};

export default paths;
