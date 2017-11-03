FROM mhart/alpine-node:8

WORKDIR .
ADD . .

EXPOSE 3210

CMD ["npm", "start"]
