#!/bin/bash -eu
# Copyright London Stock Exchange Group All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# This script pulls docker images from the Dockerhub hyperledger repositories

# set the default Docker namespace and tag
DOCKER_NS=hyperledger
ARCH=x86_64
VERSION=1.0.4

# set of Hyperledger Fabric images
FABRIC_IMAGES=(fabric-peer fabric-orderer fabric-ccenv fabric-tools fabric-ca)

for image in ${FABRIC_IMAGES[@]}; do
  echo "Pulling ${DOCKER_NS}/$image:${ARCH}-${VERSION} ..."
  docker pull ${DOCKER_NS}/$image:${ARCH}-${VERSION}
  docker tag ${DOCKER_NS}/$image:${ARCH}-${VERSION} ${DOCKER_NS}/$image:latest
done

docker images ${DOCKER_NS}/*

