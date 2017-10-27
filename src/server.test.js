import RopeServer from './server'

describe('RopeServer', () => {
  it('should initialize without an error', done => {
    let server = new RopeServer()
    server.listen()
    setTimeout(_ => {
      server.close()
      done()
    }, 500)
  })
})
