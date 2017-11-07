FROM mhart/alpine-node:8

WORKDIR /opt/rope

ADD . .

RUN npm run build

EXPOSE 3210
