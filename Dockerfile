FROM node:lts-alpine

# install simple http server for serving static content
# RUN npm install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# We can copy node_modules too if we remove it from .dockerignore
COPY . .

# install project dependencies
RUN npm install

# build app for production with minification
RUN npm run build

# RUN mv dist/* public_html/
# Host w nginx
# EXPOSE 8080
# CMD [ "http-server", "dist" ]
