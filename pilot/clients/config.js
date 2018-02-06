'use strict';

/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

/*
 * Network configurations for fabric client
 */

const CA_ADMIN = 'admin';
const CA_ADMIN_PWD = 'adminpw';

exports.netConfigJson = {
  "global" : {
    "ordererId" : "orderer.ibm.com",
    "ordererUrl" : "grpcs://localhost:7050",
    "ordererCertPath" : "../crypto-config/ordererOrganizations/ibm.com/tlsca/tlsca.ibm.com-cert.pem",
    "channel" : "channel-single",
    "chaincode" : "claim-cc",
    "claimKey" : "claim-node-e2e",
    "kvsRoot" : "hfc-key-store"
  },

  "customer" : {
    "kvsPath" : "john.customer.com",
    "certPath" : "../crypto-config/peerOrganizations/customer.com/peers/john.customer.com/msp/tlscacerts/tlsca.customer.com-cert.pem",
    "caServerId" : "ca.customer.com",
    "caServerUrl" : "https://localhost:9054",
    "admin" : CA_ADMIN,
    "adminPwd" : CA_ADMIN_PWD,
    "user" : "john",
    "mspid" : "CustomerMSP",
    "requestUrl" : "grpcs://localhost:21051",
    "eventUrl" : "grpcs://localhost:21053",
    "claimState" : "Accident Reported"
  },

  "officer" : {
    "kvsPath" : "officer.insurer.com",
    "certPath" : "../crypto-config/peerOrganizations/insurer.com/peers/officer.insurer.com/msp/tlscacerts/tlsca.insurer.com-cert.pem",    
    "caServerId" : "ca.insurer.com",
    "caServerUrl" : "https://localhost:7054",
    "admin" : CA_ADMIN,
    "adminPwd" : CA_ADMIN_PWD,
    "user" : "officer",
    "mspid" : "InsurerMSP",
    "requestUrl" : "grpcs://localhost:9051",
    "eventUrl" : "grpcs://localhost:9053",
    "claimState" : "Claim Lodged"
  },

  "assessor" : {
    "kvsPath" : "assessor.insurer.com",
    "certPath" : "../crypto-config/peerOrganizations/insurer.com/peers/assessor.insurer.com/msp/tlscacerts/tlsca.insurer.com-cert.pem",    
    "caServerId" : "ca.insurer.com",
    "caServerUrl" : "https://localhost:7054",
    "admin" : CA_ADMIN,
    "adminPwd" : CA_ADMIN_PWD,
    "user" : "assessor",
    "mspid" : "InsurerMSP",
    "requestUrl" : "grpcs://localhost:8051",
    "eventUrl" : "grpcs://localhost:8053",
    "claimState" : "Damage Assessed"
  },

  "repairer" : {
    "kvsPath" : "shop1.repairer.com",
    "certPath" : "../crypto-config/peerOrganizations/repairer.com/peers/shop1.repairer.com/msp/tlscacerts/tlsca.repairer.com-cert.pem",    
    "caServerId" : "ca.repairer.com",
    "caServerUrl" : "https://localhost:8054",
    "admin" : CA_ADMIN,
    "adminPwd" : CA_ADMIN_PWD,
    "user" : "shop1",
    "mspid" : "RepairerMSP",
    "requestUrl" : "grpcs://localhost:11051",
    "eventUrl" : "grpcs://localhost:11053",
    "claimState" : "Vehicle Fixed"
  }
};