import jobs from './jobs';
import users from './user';
import storage from './storage';
import entrypoints from './entrypoints';

export const paths = {
  ...jobs,
  ...storage,
  ...entrypoints,
  ...users
};

export default paths;
