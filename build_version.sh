#!/bin/bash
set -e
if [ $# -lt 1 ]; then
  echo "Usage: $0 <major|minor|patch|premajor|preminor|prepatch|prerelease> [rc|beta]"
  echo "Bumps the version in package.json, then creates and pushes the matching git tag."
  exit
fi
BUMP="$1"
PREID="${2:-rc}"

# Warn about potential issues before tagging.
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
warn() { echo -e "${YELLOW}WARNING: $1${NC}" >&2; }
error() { echo -e "${RED}ERROR: $1${NC}" >&2; }

if ! [[ "$BUMP" =~ ^(major|minor|patch|premajor|preminor|prepatch|prerelease)$ ]]; then
  error "<bump> must be one of major, minor, patch, premajor, preminor, prepatch, prerelease."
  exit 1
fi

if ! [[ "$PREID" =~ ^(rc|beta)$ ]]; then
  error "[preid] must be either rc or beta."
  exit 1
fi

# npm version refuses to run on a dirty tree, and a tag pointing at a commit that
# doesn't hold the code that was tested is worse than no tag at all.
if [ -n "$(git status --porcelain)" ]; then
  error "You have uncommitted changes. Commit or stash them before tagging."
  exit 1
fi

CURRENT="$(npm pkg get version | tr -d '"')"
if ! [[ "$CURRENT" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  error "No valid version in package.json (got '${CURRENT}')."
  exit 1
fi

# semver ships as a transitive dependency; npx falls back to fetching it.
SEMVER="node_modules/.bin/semver"
[ -x "$SEMVER" ] || SEMVER="npx --yes semver"
VERSION="$($SEMVER -i "$BUMP" --preid "$PREID" "$CURRENT")" || {
  error "Failed to calculate the new version."
  exit 1
}
TAG="v$VERSION"

if git tag -l "$TAG" | grep -q "^$TAG$"; then
    error "Tag '$TAG' already exists."
    exit 1
fi

# Prereleases carry a '-rc.0' style suffix and get no changelog entry of their own.
if [[ ! "$VERSION" =~ - ]]; then
  if ! grep -q "^## ${VERSION}\b" CHANGELOG.md; then
    warn "No changelog entry found for version ${VERSION} in CHANGELOG.md."
  fi
fi

echo "Current version: ${CURRENT}"
read -p "Do you want to bump to '${VERSION}' and push git tag '${TAG}' [y/N] " -n 1 -r
echo
if [[ "$REPLY" =~ ^[yY]$ ]]; then
  # Writes package.json and package-lock.json, commits both and tags the commit.
  npm version "$BUMP" --preid "$PREID" > /dev/null || { error "Failed to bump version."; exit 1; }
  # npm creates an annotated tag, so --follow-tags carries it along with the commit.
  git push --follow-tags origin HEAD || { error "Failed to push. The commit and tag '${TAG}' exist locally only."; exit 1; }
fi
