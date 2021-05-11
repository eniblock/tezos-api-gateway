#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
docker build -t k3d-registry.localhost:5000/tezos-api-gateway:0.1.0 .
docker push k3d-registry.localhost:5000/tezos-api-gateway:0.1.0
