import { Application, Router } from 'express';

import { GatewayPool } from '../../../../services/gateway-pool';
import createUserController from './create-user-controller';
import getUserController from './get-user-controller';
import getUserByAddressController from './get-user-by-address-controller';
import getUserInfoController from './get-user-info-controller';
import userMetadataController from './user-metadata-controller';
import { IndexerPool } from '../../../../services/indexer-pool';
import addUserWithPublicKeyController from './add-user-with-public-key';
import updateUserKeys from './update-user-keys';

/**
 * Setup user namespace route.
 *
 * @param   {Router} router        - The express router.
 * @param   {object} gatewayPool  - the service to interact with tezos
 * @returns {void}
 */
export default function registerUserRoutes(
  router: Router,
  gatewayPool: GatewayPool,
  indexerPool: IndexerPool,
): Router {
  router.get('/user', getUserController.getUser() as Application);

  router.post(
    '/user',
    createUserController.createUser(gatewayPool, false) as Application,
  );

  router.get(
    '/user/address',
    getUserByAddressController.getUser() as Application,
  );

  router.post(
    '/user/create',
    createUserController.createUser(gatewayPool, true) as Application,
  );

  router.get(
    '/user/info/:address',
    getUserInfoController.getUserInfo(indexerPool),
  );

  router.post(
    '/user/add',
    addUserWithPublicKeyController.addUserWithPublicKey(
      gatewayPool,
    ) as Application,
  );

  router.patch(
    '/user/update-wallet',
    updateUserKeys.selfManaged() as Application,
  );

  router.patch(
    '/user/update-delegated-wallets',
    updateUserKeys.delegated() as Application,
  );

  router.post(
    '/user/:id/metadata',
    userMetadataController.createUpdateUserMetadata(),
  );

  router.get('/user/:id/metadata', userMetadataController.getUserMetadata());

  router.delete(
    '/user/:id/metadata',
    userMetadataController.deleteUserMetadata(),
  );

  return router;
}
