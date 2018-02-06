'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.QueryChaincode');

var path = require('path');
var fs = require('fs');
var util = require('./utils.js');

exports.query = function(globConf, peerConf) {
  var fabric_client = new Fabric_Client();

  // setup the fabric network
  var channel = fabric_client.newChannel(globConf.channel);
  var peerCertFile = fs.readFileSync(path.join(__dirname, peerConf.certPath));
  var peer = fabric_client.newPeer(peerConf.requestUrl, 
    { 'pem' : Buffer.from(peerCertFile).toString(), 
      'ssl-target-name-override': peerConf.kvsPath
    });
  channel.addPeer(peer);

  var store_path = path.join(__dirname, globConf.kvsRoot, peerConf.kvsPath);
  var tx_id = null;

  return new Promise((resolve, reject) => {
    util.loadUserFromStateStore(fabric_client, store_path, peerConf.user)
    .then((memberUserCtx) => {
      if (memberUserCtx && memberUserCtx.isEnrolled()) {
        logger.info(`Successfully loaded ${peerConf.user} from persistence`);
      } else {
        throw new Error(`Failed to get ${peerConf.user} .... run registerUser.js`);
      }

      const request = {
        //targets : --- letting this default to the peers assigned to the channel
        chaincodeId: globConf.chaincode,
        fcn: 'query',
        args: [globConf.claimKey]
      };
  
      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    }).then((query_responses) => {
      logger.info("Query has completed, checking results");
      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses && query_responses.length == 1) {
        if (query_responses[0] instanceof Error) {
          logger.error("error from query = ", query_responses[0]);
          reject();
        } else {
          let claimState = query_responses[0].toString()
          logger.info("Response: ", claimState);
          resolve(claimState);
        }
      } else {
        logger.info("No payloads were returned from query");
        resolve();
      }
    }).catch((err) => {
      logger.error('Failed to query successfully :: ' + err);
      reject();
    });
  })
};