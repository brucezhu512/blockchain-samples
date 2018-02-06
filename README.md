# Blockchain Samples  [![Build Status](https://travis-ci.org/brucezhu512/blockchain-samples.svg?branch=master)](https://travis-ci.org/brucezhu512/blockchain-samples)

## Description
This is the repository for building experimental blockchain samples.

## Prerequisites
Please install Fabric v1.0.4 docker images and binary command tools by following instructions before running any blockchain sample.

```bash
# Copy binary files for MacOS, and please make sure you run it under root folder of the repository.
test -d "bin" || mkdir -p "bin" && cp ./tools/macos/* "bin"

# for linux ... then
test -d "bin" || mkdir -p "bin" && cp ./tools/linux/* "bin"

# Pull fabric v1.0.4 docker images and tag them as latest
./install-docker-images.sh
```

For Win7 users, the Docker Toolbox will only provide a lightweight Linux boot2docker.
```bash
# Copy binary files as above
test -d "bin" || mkdir -p "bin" && cp ./tools/linux/* "bin"

# Install bash (root user is not support)
# If current user is root, run 'su docker' first.
tce-load -wi bash

# Pull fabric v1.0.4 docker images and tag them as latest
bash ./install-docker-images.sh
```

## List of samples
### 1. Pilot
Basic network for motor assessment process fully driven by CLI implementation with TLS.