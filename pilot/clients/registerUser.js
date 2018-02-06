'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

/*
 * Register and Enroll a user
 */

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.RegisterUser');

var fs = require('fs');
var path = require('path');
var util = require('./utils.js');

exports.register = function(globConf, peerConf) {
  var fabric_client = new Fabric_Client();
  var fabric_ca_client = null;
  var store_path = path.join(__dirname, globConf.kvsRoot, peerConf.kvsPath);

  return new Promise((resolve, reject) => {
    util.loadUserFromStateStore(fabric_client, store_path, peerConf.admin)
    .then((adminUserCtx) => {
      if (adminUserCtx && adminUserCtx.isEnrolled()) {
        logger.info('Successfully loaded admin from persistence');
      } else {
        throw new Error('Failed to get admin.... run enrollAdmin.js');
      }

      if (fs.existsSync(path.join(store_path, peerConf.user))) {
        logger.info(`Successfully found ${peerConf.user} keys from persistence`);
         return null;
      } else {
        // setup fabric ca-client before enrolling user with CA if it wasn't
        // be sure to change the http to https when the CA is running TLS enabled
        fabric_ca_client = new Fabric_CA_Client(peerConf.caServerUrl, 
          { trustedRoots: [],
            verify: false
          }, peerConf.caServerId, fabric_client.getCryptoSuite());

        // at this point we should have the admin user
        // first need to register the user with the CA server
        return fabric_ca_client.register({enrollmentID: peerConf.user, affiliation: 'org1.department1'}, adminUserCtx);
      }
    }).then((secret) => {
      if(secret !== null) {
        // next we need to enroll the user with CA server
        logger.info(`Successfully registered ${peerConf.user} - secret: ${secret}`);
        return fabric_ca_client.enroll({enrollmentID: peerConf.user, enrollmentSecret: secret});
      }
      return null;
    }).then((enrollment) => {
      if(enrollment !== null) {
        logger.info(`Successfully enrolled member user "${peerConf.user}"`);
        return fabric_client.createUser(
          { username: peerConf.user,
            mspid: peerConf.mspid,
            cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });
      }
      return null;
    }).then((memberUser) => {
      if(memberUser !== null) {
        return fabric_client.setUserContext(memberUser);
      }
    }).then(()=>{
      logger.info(`${peerConf.user} was successfully registered and enrolled and is ready to intreact with the fabric network`);
      resolve();
    }).catch((err) => {
      logger.error('Failed to register: ' + err);
      if(err.toString().indexOf('Authorization') > -1) {
        logger.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
        'Try again after deleting the contents of the store directory '+store_path);
      }
      reject();
    });
  });  
};
