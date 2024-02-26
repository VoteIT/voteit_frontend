# FROM voteit/voteit4dev:${BACKEND_VERSION} as backend
FROM voteit/voteit4dev:latest as backend
USER root
RUN DJANGO_SETTINGS_MODULE=voteit_project.settings_docker_build ./manage.py collectstatic --noinput

FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY ./etc/nginx.conf /etc/nginx/conf.d
COPY ./dist /app/public_html
COPY --from=backend /app/static /app/public_html/static
