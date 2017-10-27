FROM scratch
FROM centurylink/ca-certs

ADD rope-node /

# needs to be exposed over a tunnel
# ENV ROPEHOST http://0.0.0.0:3210
CMD ["/rope-node"]
