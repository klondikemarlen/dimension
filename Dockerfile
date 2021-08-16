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

COPY . /code
WORKDIR /code

RUN chmod +x bin/*
RUN chmod +x config/init/*

CMD /bin/bash -c "bin/initialize-and-boot-app -- yarn serve"
