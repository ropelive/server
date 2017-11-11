![](https://raw.githubusercontent.com/ropelive/press/master/banners/rope-server-js.png)

[![CircleCI](https://circleci.com/gh/ropelive/server/tree/master.svg?style=svg)](https://circleci.com/gh/ropelive/server/tree/master)
[![NPM version](https://img.shields.io/npm/v/@rope/server.svg)](https://www.npmjs.com/package/@rope/server)

Rope is a public Kite registry with proxy support between kites. Also
introduces bi-directional communication between Kites.

# Getting Started

Before starting make sure to call `npm install` and
`go get github.com/koding/kite` if you want to try go example.
Then to start Rope server;

```sh
npm start
```

This will start the server on `0.0.0.0:3210` which then you can run one of
the node examples (in another terminal session);

```sh
node nodes/js/rope-node.js
```

will create a Rope Node with Node.js, same file also supports browsers which
you can try it out with;

```sh
open nodes/js/index.html
```

will load the `kite.js` bundle and then runs the `rope-node.js` which will
create another Rope Node in the browser this time.

To try another Rope Node in Go this time;

```sh
go run nodes/go/rope-node.go
```

Once ready, you can start playing with nodes by calling `run` over
`Rope Server`. The best way to do that for now opening Dev Console in your
choice of Browser after loading the `nodes/js/index.html`. Which will connect
to `Rope Server`, identifies itself and will get a list of Kites registered
before which you can access from `publicKites` global variable. There will be
another public variable called `kite` which will allow you to interact with
`Rope Server`. And for an example of usage of `run` over `Rope Server` would
be (in Dev Console of nodes/js/index.html);

## `kite.ping`

```js
 > kite.tell('run', {
      kiteId: publicKites[0].id,
      method: "kite.ping"
   }).then(console.log.bind(console))

 pong
```

will ping the first public kite which will end with a simple `pong`

## `kite.systemInfo`

```js
 > kite.tell('run', {
      kiteId: publicKites[0].id,
      method: "kite.systemInfo"
   }).then(console.log.bind(console))

 {
   diskTotal: 975902848,
   diskUsage: 328007624,
   homeDir: "/Users/rope",
   memoryUsage: 12602589184,
   state: "RUNNING",
   totalMemoryLimit: 17179869184,
   uname: "darwin",
 }
```

will return the system info from first public kite.


## `kite.prompt`

```js
 > kite.tell('run', {
      kiteId: publicKites[0].id,
      method: "kite.prompt",
      args: ["Your Name? "]
   }).then(console.log.bind(console))

 # on the terminal of first public kite you will see the prompt "Your Name? "

   $ go run nodes/go/rope-node.go

   2017-07-06 01:24:30 [dope] INFO     New listening: 0.0.0.0:49558
   2017-07-06 01:24:30 [dope] INFO     Serving...
   2017-07-06 01:24:30 [dope] INFO     Identify requested!
   2017-07-06 01:24:30 [dope] INFO     Identified as
      8542b5e3-fc67-4c6b-a368-968c12d69357 now!

   Your Name? Gokmen

 # once provided it will return the result to the browser console.
 Gokmen
```

## `square`

```js
 > kite.tell('run', {
      kiteId: publicKites[0].id,
      method: "square",
      args: [5]
   }).then(console.log.bind(console))

 25
```

you can check it out the implementations under `nodes/{go, js}`

# License

MIT (c) 2017 Rope
