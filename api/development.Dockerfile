FROM node:22.16.0-bookworm

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
