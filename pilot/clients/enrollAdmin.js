'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

/*
 * Enroll the admin user
 */

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var path = require('path');
var util = require('./utils.js');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.EnrollAdmin');

exports.enroll = function(globConf, peerConf) {
  var fabric_client = new Fabric_Client();
  var store_path = path.join(__dirname, globConf.kvsRoot, peerConf.kvsPath); 

  // admin user context variable for debug purpose 
  var _admin_user = null;
  return new Promise((resolve, reject) => {
    util.loadUserFromStateStore(fabric_client, store_path, peerConf.admin)
    .then((adminUserCtx) => {
      if (adminUserCtx && adminUserCtx.isEnrolled()) {
        logger.info('Successfully loaded admin from persistence');
        _admin_user = adminUserCtx;
        return null;
      } else {
        // setup fabric ca-client before enrolling user with CA if it wasn't
        // be sure to change the http to https when the CA is running TLS enabled
        let fabric_ca_client = new Fabric_CA_Client(peerConf.caServerUrl, 
          { trustedRoots: [],
            verify: false
          }, peerConf.caServerId, fabric_client.getCryptoSuite());
      
        // need to enroll it with CA server
        return fabric_ca_client.enroll({
          enrollmentID: peerConf.admin,
          enrollmentSecret: peerConf.adminPwd
        }).then((enrollment) => {
          logger.info(`Successfully enrolled admin user "${peerConf.admin}"`);
          return fabric_client.createUser(
            {username: peerConf.admin,
              mspid: peerConf.mspid,
              cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });
        }).then((user) => {
          _admin_user = user;
          return fabric_client.setUserContext(user);
        }).catch((err) => {
          logger.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
          throw new Error('Failed to enroll admin');
        });
      }
    }).then(() => {
      logger.debug('Assigned the admin user to the fabric client ::' + _admin_user.toString());
      resolve();
    }).catch((err) => {
      logger.error('Failed to enroll admin: ' + err);
      reject();
    });
  });
};

