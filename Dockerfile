FROM node:lts-alpine

# make the 'app' folder the current working directory
WORKDIR /app

# We can copy node_modules too if we remove it from .dockerignore
COPY . .

# install project dependencies
RUN npm install

# build app for production with minification
RUN npm run build
