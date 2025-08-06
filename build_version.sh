#!/bin/bash
set -e
if [ $# -lt 1 ]; then
  echo "Usage: build_version.sh <version>"
  exit
fi
VERSION="$1"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.(rc|beta)?[0-9]+$ ]]; then
  echo "<version> must be in format <number>.<number>.(rc|beta)?<number>, i.e."
  exit 1
fi

read -p "Do you want to add and push git tag 'v${VERSION}' [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  git tag v${VERSION}
  git push --tags
fi
