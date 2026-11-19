# The base image is pinned by digest so a rebuild of an old tag cannot silently
# change what lands in the image. Dependabot (.github/dependabot.yml) bumps it;
# without that, security updates to the base stop arriving.
FROM nginx:1-alpine-slim@sha256:5bfced78d24d644270bedb0a9968697042e38d5c03fb6354603df025279c1cbe
RUN rm /etc/nginx/conf.d/default.conf
COPY ./etc/nginx.conf /etc/nginx/conf.d
COPY ./dist /app/public_html
