import jobs from './jobs';
import storage from './storage';
import entrypoints from './entrypoints';

export const paths = {
  ...jobs,
  ...storage,
  ...entrypoints,
};

export default paths;
