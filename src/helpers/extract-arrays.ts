import { ACTION } from '../lib/generate-path-object';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

/**
 * From the path object which contains the list of paths (forge and send transactions paths)
 * Return an object of 3 arrays, containing either forge paths, send transactions paths or asynchronous send transactions paths
 *
 * @param {object} forgeAndSendPaths   - the path object which contains forge and send transactions paths
 *
 * @return {object} the object contains 2 arrays (forgePaths array and sendPaths array);
 */
export function extractForgeAndSendTransactionsPaths(
  forgeAndSendPaths: OpenAPIV3.PathsObject,
) {
  const paths = Object.keys(forgeAndSendPaths);

  const forgePaths = paths.filter((path) => path.includes(`/${ACTION.FORGE}/`));
  const sendPaths = paths.filter(
    (path) => path.includes(`/${ACTION.SEND}/`) && !path.includes(`async`),
  );
  const asyncSendPaths = paths.filter(
    (path) => path.includes(`/${ACTION.SEND}/`) && path.includes(`async`),
  );

  return { forgePaths, sendPaths, asyncSendPaths };
}
