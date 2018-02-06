'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

/*
 * Chaincode Invoke
 */

var Fabric_Client = require('fabric-client');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.InvokeChaincode');

var path = require('path');
var fs = require('fs');
var util = require('./utils.js');

exports.invoke = function(globConf, peerConf) {
	var fabric_client = new Fabric_Client();
	
	// setup the fabric network
	var channel = fabric_client.newChannel(globConf.channel);
	var peerCertFile = fs.readFileSync(path.join(__dirname, peerConf.certPath));
	var peer = fabric_client.newPeer(peerConf.requestUrl, 
		{ 'pem': Buffer.from(peerCertFile).toString(), 
			'ssl-target-name-override': peerConf.kvsPath
		});
	channel.addPeer(peer);
	
	var ordererCertFile = fs.readFileSync(path.join(__dirname, globConf.ordererCertPath)); 
	var orderer = fabric_client.newOrderer(globConf.ordererUrl, 
		{ 'pem': Buffer.from(ordererCertFile).toString(), 
			'ssl-target-name-override': globConf.ordererId
		});
	channel.addOrderer(orderer);
	
	var store_path = path.join(__dirname, globConf.kvsRoot, peerConf.kvsPath);
	var tx_id = null;
	
	return new Promise((resolve, reject) => {
		util.loadUserFromStateStore(fabric_client, store_path, peerConf.user)
		.then((memberUserCtx) => {
			if (memberUserCtx && memberUserCtx.isEnrolled()) {
				logger.info(`Successfully loaded ${peerConf.user} from persistence`);
			} else {
				throw new Error(`Failed to get ${peerConf.user}.... run registerUser.js`);
			}
		
			// get a transaction id object based on the current user assigned to fabric client
			tx_id = fabric_client.newTransactionID();
			logger.info("Assigning transaction_id: ", tx_id._transaction_id);
		
			// must send the proposal to endorsing peers
			var request = {
				//targets: let default to the peer assigned to the client
				chaincodeId: globConf.chaincode,
				fcn: 'update',
				args: [globConf.claimKey, peerConf.claimState],
				chainId: globConf.channel,
				txId: tx_id
			};
		
			// send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
		}).then((results) => {
			var proposalResponses = results[0];
			var proposal = results[1];
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					logger.info('Transaction proposal was good');
				} else {
					logger.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				logger.info(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message);
		
				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
		
				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				let event_hub = fabric_client.newEventHub();
				event_hub.setPeerAddr(peerConf.eventUrl, {'pem': Buffer.from(peerCertFile).toString(), 'ssl-target-name-override': peerConf.kvsPath});
		
				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							logger.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							logger.info('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} else {
				logger.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			}
		}).then((results) => {
			logger.info('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				logger.error('Failed to order the transaction. Error code: ' + response.status);
			}
		
			if(results && results[1] && results[1].event_status === 'VALID') {
				logger.info('Successfully committed the change to the ledger by the peer');
				resolve();
			} else {
				logger.info('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
				reject();
			}
		}).catch((err) => {
			logger.error('Failed to invoke successfully :: ' + err);
			reject();
		});
	});

}

