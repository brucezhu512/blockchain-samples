#!/bin/bash

####################################################
############ Shared functions HERE !!!  ############
####################################################

function setGlobalParams() {
  # User-defined variables prefixed with MAFN_
  echo; echo "# Set Global Parameters ..."
  export MAFN_DELAY=3
  export MAFN_ORDERER_ADDRESS=orderer.ibm.com:7050

  echo "# MAFN_DELAY                   -> $MAFN_DELAY"
  echo "# MAFN_ORDERER_ADDRESS         -> $MAFN_ORDERER_ADDRESS"

  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    export MAFN_ORDERER_CAFILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ibm.com/orderers/orderer.ibm.com/msp/tlscacerts/tlsca.ibm.com-cert.pem
    echo "# MAFN_ORDERER_CAFILE          -> $MAFN_ORDERER_CAFILE"
  fi
}

function setPeerParams() {
  echo; echo "# Set Peer Parameters for [$1.$2] ..."
  export CORE_PEER_ADDRESS=$1.$2:7051
  export CORE_PEER_LOCALMSPID=$3
  export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$2/users/Admin@$2/msp
      
  echo "# CORE_PEER_ADDRESS            -> $CORE_PEER_ADDRESS"
  echo "# CORE_PEER_LOCALMSPID         -> $CORE_PEER_LOCALMSPID"
  echo "# CORE_PEER_MSPCONFIGPATH      -> $CORE_PEER_MSPCONFIGPATH"

  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$2/peers/$1.$2/tls/ca.crt
    export CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$2/peers/$1.$2/tls/server.crt
    export CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$2/peers/$1.$2/tls/server.key
    echo "# CORE_PEER_TLS_ROOTCERT_FILE  -> $CORE_PEER_TLS_ROOTCERT_FILE"
    echo "# CORE_PEER_TLS_CERT_FILE      -> $CORE_PEER_TLS_CERT_FILE"
    echo "# CORE_PEER_TLS_KEY_FILE       -> $CORE_PEER_TLS_KEY_FILE"
  fi
}

function printAndRun() {
  echo "# COMMAND: $1"
  eval $1
}

function createChannel() {
  echo; echo "# Create Channel [$1] by $CORE_PEER_ADDRESS ..."
  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    printAndRun "peer channel create -o $MAFN_ORDERER_ADDRESS -c $1 -f ./channel-artifacts/$1.tx --tls $CORE_PEER_TLS_ENABLED --cafile $MAFN_ORDERER_CAFILE"
  else
    printAndRun "peer channel create -o $MAFN_ORDERER_ADDRESS -c $1 -f ./channel-artifacts/$1.tx"
  fi
}

function joinChannel() {
  echo; echo "# Join Channel [$1] with $CORE_PEER_ADDRESS ..."
  printAndRun "peer channel join -b $1.block"
}

function updateAnchorMSP() {
  echo; echo "# Create & update $2 with channel [$1] ..."
  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    printAndRun "peer channel update -o $MAFN_ORDERER_ADDRESS -c $1 -f ./channel-artifacts/${2}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $MAFN_ORDERER_CAFILE"
  else
    printAndRun "peer channel update -o $MAFN_ORDERER_ADDRESS -c $1 -f ./channel-artifacts/${2}anchors.tx"
  fi
}

function installChaincode() {
  echo; echo "# Install Chaincode [$1] on peer [$CORE_PEER_ADDRESS] ..."
  printAndRun "peer chaincode install -n $1 -v 1.0 -p github.com/chaincode/"
}

function instantiateChaincode() {
  echo; echo "# Instantiate Chaincode [$2] in channel [$1] on peer [$CORE_PEER_ADDRESS] ..."
  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    printAndRun "peer chaincode instantiate -o $MAFN_ORDERER_ADDRESS --tls $CORE_PEER_TLS_ENABLED --cafile $MAFN_ORDERER_CAFILE -C $1 -n $2 -v 1.0 -c '"'{"Args":["init", "'$3'","'$4'"]}'"' -P \"OR ('CustomerMSP.member','InsurerMSP.member','RepairerMSP.member')\""
  else
    printAndRun "peer chaincode instantiate -o $MAFN_ORDERER_ADDRESS -C $1 -n $2 -v 1.0 -c '"'{"Args":["init", "'$3'","'$4'"]}'"' -P \"OR ('CustomerMSP.member','InsurerMSP.member','RepairerMSP.member')\""
  fi
}

function deployChaincode() {
  # Install Chaincode
  installChaincode $2

  # Instantiate Chaincode
  instantiateChaincode $1 $2 $3 $4
}

function queryChaincode() {
  echo; echo "# Query Chaincode [$2] in channel [$1] on peer [$CORE_PEER_ADDRESS] ..."
  printAndRun "peer chaincode query -C $1 -n $2 -c '"'{"Args":["query", "'$3'"]}'"'"
}

function invokeChaincode() {
  echo; echo "# Invoke Chaincode [$2] in channel [$1] on peer [$CORE_PEER_ADDRESS] ..."
  if [ "$CORE_PEER_TLS_ENABLED" == "true" ]; then
    printAndRun "peer chaincode invoke -o $MAFN_ORDERER_ADDRESS --tls $CORE_PEER_TLS_ENABLED --cafile $MAFN_ORDERER_CAFILE  -C $1 -n $2 -c '"'{"Args":["update","'$3'","'$4'"]}'"'"
  else
    printAndRun "peer chaincode invoke -o $MAFN_ORDERER_ADDRESS -C $1 -n $2 -c '"'{"Args":["update","'$3'","'$4'"]}'"'"
  fi
}

function testChaincode() {
  # Invoke Chaincode to given status
  invokeChaincode $CHANNEL_NAME $CHAINCODE_NAME $CLAIM_KEY $1

  # Query Chaincode to verify the result
  wait $MAFN_DELAY
  queryChaincode $CHANNEL_NAME $CHAINCODE_NAME $CLAIM_KEY
}

function wait() {
  echo; echo "# Waiting $1 second(s) for next call ..."
  sleep $1
}

function buildChannel() {
  echo; echo "# ========= Build Channel by Customer starts ========= #"

  # Set Peer Parameters
  setPeerParams $1 $2 $3

  # Create Channel
  createChannel $CHANNEL_NAME

  # Join Channel
  joinChannel $CHANNEL_NAME

  # Create & update anchor peer MSP
  updateAnchorMSP $CHANNEL_NAME $3

  # Deploy Chaincode to john
  deployChaincode $CHANNEL_NAME $CHAINCODE_NAME $CLAIM_KEY $4

  # Query Chaincode to verify the result
  wait $MAFN_DELAY
  queryChaincode $CHANNEL_NAME $CHAINCODE_NAME $CLAIM_KEY

  echo "# ========= Build Channel by Customer ends ========= #"
}

function joinChannelAsOrg() {
  echo; echo "# ========= Join Channel with Org [$2] starts ========= #"
  for PEER in $1
  do
    # Set Peer Parameters
    setPeerParams $PEER $2 $3

    # Join Channel
    joinChannel $CHANNEL_NAME

    # Deploy Chaincode
    deployChaincode $CHANNEL_NAME $CHAINCODE_NAME $CLAIM_KEY ''

  done
  echo; echo "# ========= Join Channel with Org [$2] ends ========= #"
}