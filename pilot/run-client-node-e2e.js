'use strict';

var config = require('./clients/config.js');
var enrollAdmin = require('./clients/enrollAdmin.js');
var registerUser = require('./clients/registerUser.js');
var queryCC = require('./clients/query.js');
var invokeCC = require('./clients/invoke.js');

var log4js = require('log4js');
var logger = log4js.getLogger('fcn.NodeClient-e2e');

var conf = config.netConfigJson;

testChaincode(conf.global, conf.customer).then(() => {
  testChaincode(conf.global, conf.officer).then(() => {
    testChaincode(conf.global, conf.assessor).then(() => {
      testChaincode(conf.global, conf.repairer);
    });
  });
});

function testChaincode(globConf, peerConf) {
  return new Promise((resolve) => {
    logger.info(`######## Test Chaincode on ${peerConf.kvsPath} starts ########`);
    enrollAdmin.enroll(globConf, peerConf)
    .then(() => {
      registerUser.register(globConf, peerConf)
      .then(() => {
        invokeCC.invoke(globConf, peerConf)
        .then(() => {
          queryCC.query(globConf, peerConf)
          .then(() => {
            logger.info(`##############################################################################`);
            console.log('');
            resolve();
          });
        });
      });
    });
  })
}
