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

TAG="v$VERSION"

if git tag -l "$TAG" | grep -q "^$TAG$"; then
    echo "Tag '$TAG' already exists."
    exit 1
fi

# Warn about potential issues before tagging.
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
warn() { echo -e "${YELLOW}WARNING: $1${NC}"; }

if [ -n "$(git status --porcelain)" ]; then
  warn "You have uncommitted changes. They will not be included in the tag."
fi

if [[ ! "$VERSION" =~ (rc|beta) ]]; then
  if ! grep -q "^## ${VERSION}\b" CHANGELOG.md; then
    warn "No changelog entry found for version ${VERSION} in CHANGELOG.md."
  fi
fi

read -p "Do you want to add and push git tag '${TAG}' [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  git tag ${TAG} || { echo "Failed to create tag."; exit 1; }
  git push origin "${TAG}" || { echo "Failed to push tag."; exit 1; }
fi
