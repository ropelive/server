![](https://raw.githubusercontent.com/ropelive/press/master/banners/rope-node-go.png)

Rope-Node in Go
---------------

To static build rope-node again after changes;

`CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o rope-node`

Then rebuild the container;

`docker build -t rope-go .`

If you need to build it in a docker container you can use Dockerfile.build;

`docker build -f Dockerfile.build -t rope-go .`

And for running it;

`docker run -it --rm rope-go`
 
If you need to use a custom rope host;

`docker run -e ROPEHOST=http://0.0.0.0:3210 -it --rm rope-go`

