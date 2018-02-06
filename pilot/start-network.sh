#!/bin/bash
./generate-artifacts.sh

docker-compose -f docker-compose-cli.yaml up -d 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR !!!! Unable to start network"
  docker logs -f cli
  exit 1
fi
echo 'start checking logs'
docker logs -f cli