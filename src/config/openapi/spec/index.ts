import components from './components';
import info from './info';
import paths from './paths';

const spec = {
  openapi: '3.0.1',
  servers: [
    {
      description: 'API Server',
      url: '/api',
    },
  ],
  info,
  components,
  paths,
};

export default spec;
