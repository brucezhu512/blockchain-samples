/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('FabricClaimsApp');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var cors = require('cors');

var config = require('./clients/config.js');
var enrollAdmin = require('./clients/enrollAdmin.js');
var registerUser = require('./clients/registerUser.js');
var queryCC = require('./clients/query.js');
var invokeCC = require('./clients/invoke.js');

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));


///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(4000, function() {});
logger.info('****************** SERVER STARTED ************************');
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Register and enroll user
app.post('/peer/:peer/claims/:claimKey/:claimState', function(req, res) {
	var peer = req.params.peer;
	var claimKey = req.params.claimKey;
	var claimState = req.params.claimState
	
	logger.debug('Peer name : ' + peer);
	logger.debug('Claim Key : ' + claimKey);
	logger.debug('Claim State : ' + claimState);

  var conf = config.netConfigJson;
  var globConf = conf.global;
	var peerConf = conf[peer];

	globConf.claimKey = claimKey;
	peerConf.claimState = claimState;
	
	enrollAdmin.enroll(globConf, peerConf).then(() => {
		registerUser.register(globConf, peerConf).then(() => {
			invokeCC.invoke(globConf, peerConf).then(() => {
				queryCC.query(globConf, peerConf).then((state) => {
					res.json({
						success: true,
						claim : claimKey,
						state: state
          });
          
					return;
				});
			});
		});
  });
});

