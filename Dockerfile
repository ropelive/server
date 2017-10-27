FROM mhart/alpine-node:base-8

WORKDIR .
ADD . .

EXPOSE 3210

CMD ["npm", "start"]
