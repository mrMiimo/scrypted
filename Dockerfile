FROM node:16
RUN apt-get -y update
RUN apt-get -y upgrade
COPY . .
WORKDIR /server
RUN apt-get -y update
RUN apt-get -y install libavahi-compat-libdnssd-dev
RUN npm install
RUN npm run build
CMD npm run serve-no-build
