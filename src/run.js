import RopeServer from './server'

let port = process.env['ROPE_PORT']
new RopeServer().listen(port)
