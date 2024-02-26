#!/bin/bash
set -e
if [ $# -lt 1 ]; then
  echo "Usage: build.sh <version>"
  exit
fi
VERSION="$1"
# BACKEND_VERSION="latest"
# docker build . -t voteit/voteit4frontend:$VERSION --progress plain --build-arg BACKEND_VERSION=$BACKEND_VERSION

# Ugly
# If .env.production is ever needed, do this in another way!
if [ -e '.env.production' ]; then
  echo 'File .env.production must not exist'
  exit 1
fi
echo VITE_FRONTEND_VERSION=$VERSION > .env.production
# Always build dist files
npm run build
# Clean up temp file
rm .env.production

docker pull nginx:1.25-alpine
docker build . -t voteit/voteit4frontend:$VERSION --platform linux/amd64

read -p "Do you want to push to Docker Hub? [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  docker push voteit/voteit4frontend:$VERSION
fi
