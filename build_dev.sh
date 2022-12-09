#!/bin/bash
set -e
if [ $# -lt 1 ]; then
  echo "Usage: build_dev.sh <version>"
  exit
fi
VERSION="$1"
# BACKEND_VERSION="latest"
# docker build . -t voteit/voteit4frontend:$VERSION --progress plain --build-arg BACKEND_VERSION=$BACKEND_VERSION

read -p "Do you want to build distribution files now? [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  npm run build
fi

docker build . -t voteit/voteit4frontend:$VERSION --platform linux/amd64

read -p "Do you want to push to Docker Hub? [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  docker push voteit/voteit4frontend:$VERSION
fi
