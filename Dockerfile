FROM scratch
WORKDIR /app
COPY ./dist ./dist
# COPY package.json .
# install project dependencies first
# RUN npm i
# Lastly build app
# COPY . .
# RUN npm run build
