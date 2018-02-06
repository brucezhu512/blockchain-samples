'use strict';

/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

/*
 * Util class for fabric client setup
 */

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.Utils');

exports.loadUserFromStateStore = function(fabric_client, store_path, username, callback) {
  logger.debug(`Loading ${username} from store path: ${store_path}`);
  // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
  return Fabric_Client.newDefaultKeyValueStore({ path: store_path }).then((state_store) => {
    // assign the store to the fabric client
    fabric_client.setStateStore(state_store);

    var crypto_suite = Fabric_Client.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);

    // first check to see if the specific user is already enrolled
    return fabric_client.getUserContext(username, true);
  });
}
