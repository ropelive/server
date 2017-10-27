FROM mhart/alpine-node:base-8

WORKDIR .
ADD . .

# needs to be exposed over a tunnel
# ENV ROPEHOST http://0.0.0.0:3210
CMD ["node", "rope-node.js"]
