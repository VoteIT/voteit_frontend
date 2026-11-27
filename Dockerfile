# The base image is pinned by digest so a rebuild of an old tag cannot silently
# change what lands in the image. Dependabot (.github/dependabot.yml) bumps it;
# without that, security updates to the base stop arriving.
#
# nginx-unprivileged runs as uid 101 rather than root, so it cannot bind
# ports below 1024: etc/nginx.conf listens on 8080.
FROM nginx/nginx-unprivileged:1-alpine-slim@sha256:f4afc48254dc77ea692ec6979d220e5b1176331c636a4d51c502ffdded6789bd
COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /app/public_html
