FROM ubuntu:20.04

# base packages
RUN apt-get update -y
RUN apt-get install -y apt-utils 
RUN apt-get install -y curl
RUN apt-get install -y gcc
RUN apt-get install -y git
RUN apt-get install -y g++
RUN apt-get install -y make
RUN curl -L https://git.io/n-install | bash -s -- -y

ENV PATH="/root/n/bin:${PATH}"

# Things I actually want
RUN npm install npm@latest -g
RUN npm install -g @vue/cli
RUN npm install -g yarn

COPY . /code

WORKDIR /code
RUN yarn install

CMD yarn serve
