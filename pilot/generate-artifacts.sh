#!/bin/bash

# Generates Org certs using cryptogen tool
function generateCerts() {
  echo
  echo "##########################################################"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "##########################################################"

  if [ -d "crypto-config" ]; then
    rm -Rf crypto-config
  fi

  # Generate orderer & peers' ca certificates and msp keystore
  ../bin/cryptogen generate --config=./crypto-config.yaml

  if [ "$?" -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi
  echo
}

# Generate orderer genesis block, channel configuration transaction and anchor peer update transactions
function generateOrdererGenesisBlock() {

  if [ -d "channel-artifacts" ]; then
    rm -Rf channel-artifacts/*
  else
    mkdir channel-artifacts
  fi

  echo "##########################################################"
  echo "#########  Generating Orderer Genesis block ##############"
  echo "##########################################################"
  # Note: For some unknown reason (at least for now) the block file can't be
  # named orderer.genesis.block or the orderer will fail to launch!
  # Generate genesis block of orderer
  ../bin/configtxgen -profile ClaimOrdererGenesis -outputBlock ./channel-artifacts/genesis.block

  if [ "$?" -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi
}

function generateChannelArtifacts() {
  export CHANNEL_NAME="channel-$1"  
  echo
  echo "#################################################################"
  echo "### Generating channel configuration transaction '$CHANNEL_NAME.tx'"
  echo "#################################################################"
  # Generate channel artifacts
  ../bin/configtxgen -profile ClaimChannel -outputCreateChannelTx ./channel-artifacts/$CHANNEL_NAME.tx -channelID $CHANNEL_NAME

  if [ "$?" -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for InsurerMSP   #######"
  echo "#################################################################"
  ../bin/configtxgen -profile ClaimChannel -outputAnchorPeersUpdate ./channel-artifacts/InsurerMSPanchors.tx -channelID $CHANNEL_NAME -asOrg InsurerOrg
  if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for InsurerMSP..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for RepairerMSP   ######"
  echo "#################################################################"
  ../bin/configtxgen -profile ClaimChannel -outputAnchorPeersUpdate ./channel-artifacts/RepairerMSPanchors.tx -channelID $CHANNEL_NAME -asOrg RepairerOrg
  if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for RepairerMSP..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for CustomerMSP   ######"
  echo "#################################################################"
  ../bin/configtxgen -profile ClaimChannel -outputAnchorPeersUpdate ./channel-artifacts/CustomerMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CustomerOrg
  if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for CustomerMSP..."
    exit 1
  fi
}

function replacePrivateKey () {
  # sed on MacOSX does not support -i flag with a null extension. We will use
  # 't' for our back-up's extension and depete it at the end of the function
  ARCH=`uname -s | grep Darwin`
  if [ "$ARCH" == "Darwin" ]; then
    OPTS="-it"
  else
    OPTS="-i"
  fi

  echo
  echo "#################################################################"
  echo "#######    Replacing the private key for ca servers   ###########"
  echo "#################################################################"
  # Copy the template to the file that will be modified to add the private key
  cp ./base/ca-base-template.yaml ./base/ca-base.yaml

  CURRENT_DIR=$PWD
  cd crypto-config/peerOrganizations/insurer.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed $OPTS "s/CA_INSURER_PRIVATE_KEY/${PRIV_KEY}/g" ./base/ca-base.yaml

  cd crypto-config/peerOrganizations/repairer.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed $OPTS "s/CA_REPAIRER_PRIVATE_KEY/${PRIV_KEY}/g" ./base/ca-base.yaml

  cd crypto-config/peerOrganizations/customer.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed $OPTS "s/CA_CUSTOMER_PRIVATE_KEY/${PRIV_KEY}/g" ./base/ca-base.yaml
  # If MacOSX, remove the temporary backup of the docker-compose file
  if [ "$ARCH" == "Darwin" ]; then
    rm ./base/ca-base.yamlt
  fi
  echo "Fabric CA docker compose file generated."
}

export FABRIC_CFG_PATH=${PWD}
generateCerts
generateOrdererGenesisBlock
generateChannelArtifacts 'single'
replacePrivateKey
