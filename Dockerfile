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


# Things I actually want
RUN npm install -g yarn 

WORKDIR /code
RUN yarn set version berry
RUN yarn install

CMD /bin/true
