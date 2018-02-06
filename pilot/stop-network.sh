#!/bin/bash

docker-compose -f docker-compose-cli.yaml down

echo 'Removing containers and images for fabric-shim layer installed.'
docker ps -a | grep '\<dev-.*' | awk '{print $1}' |xargs -I {} docker rm {}
docker rmi $(docker images | grep '\<dev-.*' | awk '{print $1}')

rm -rf clients/hfc-key-store
echo 'KeyValue store removed.'

rm -rf channel-artifacts/* crypto-config
echo 'Channel-artifacts & crypto-config removed.'
echo 'The network stopped!'