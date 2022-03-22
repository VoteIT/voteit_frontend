#!/bin/bash
set -e
if [ $# -lt 1 ]; then
  echo "Usage: build_dev.sh <version>"
  exit
fi
VERSION="$1"
# BACKEND_VERSION="latest"
# docker build . -t voteit/voteit4frontend:$VERSION --progress plain --build-arg BACKEND_VERSION=$BACKEND_VERSION
docker build . -t voteit/voteit4frontend:$VERSION --progress plain
echo "If everything worked: "
echo "docker push voteit/voteit4frontend:$VERSION"
