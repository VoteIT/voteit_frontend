FROM nginx:1-alpine-slim
RUN rm /etc/nginx/conf.d/default.conf
COPY ./etc/nginx.conf /etc/nginx/conf.d
COPY ./dist /app/public_html
