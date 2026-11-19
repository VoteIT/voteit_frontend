# The base image is pinned by digest so a rebuild of an old tag cannot silently
# change what lands in the image. Dependabot (.github/dependabot.yml) bumps it;
# without that, security updates to the base stop arriving.
#
# nginx-unprivileged runs as uid 101 rather than root, so it cannot bind
# ports below 1024: etc/nginx.conf listens on 8080.
FROM nginx/nginx-unprivileged:1-alpine-slim@sha256:75e85a09b0f25bd46d49a9fd85589ffa70b0459c8ed5ee0dc6596fd642e1f829
COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /app/public_html
