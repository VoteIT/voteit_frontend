FROM node:lts-alpine
WORKDIR /app
COPY package.json .
# install project dependencies first
RUN npm i
# Lastly build app
COPY . .
RUN npm run build
