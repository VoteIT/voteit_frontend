#!/usr/bin/env bash
# Read the nginx version out of a local image and check it against nginx.org's
# security advisories. Usage: check_nginx_image.sh IMAGE [--fail-on SEVERITY]
set -euo pipefail

image="$1"
shift

# No network: the container only needs to print its version.
version="$(docker run --rm --network none --entrypoint nginx "$image" -v 2>&1 \
  | sed -n 's|^nginx version: nginx/||p' || true)"
if [ -z "$version" ]; then
  echo "::error::Could not read the nginx version from $image"
  exit 2
fi

exec python3 -I "$(dirname "$0")/check_nginx_advisories.py" "$version" "$@"
