import { PORT, BLACKLIST_LIMIT, LOG_LEVEL, AUTH } from './constants'

import RopeApi from './api'
import RopeContext from './context'

import { KiteServer, KiteApi } from 'kite.js'
import uaParser from 'ua-parser-js'

export default class Server extends KiteServer {
  constructor(options = {}) {
    super({
      name: 'rope',
      logLevel: LOG_LEVEL,
      serverClass: KiteServer.transport.SockJS,
    })

    this.ctx = new RopeContext()
    this.ropeApi = new RopeApi(this)

    this.setApi(
      new KiteApi(this, {
        auth: AUTH,
        methods: this.ropeApi.getMethods(),
      })
    )
  }

  // FIXME in kite.js::KiteServer
  getKiteInfo() {}

  handleMessage(proto, message) {
    let kite
    if (message.arguments[0] && (kite = message.arguments[0].kite)) {
      this.logger.debug(`${kite.id} requested to run ${message.method}`)
      this.logger.debug(proto)
      // do not touch internal methods
      if (!/^kite\./.test(message.method)) {
        let args = message.arguments[0].withArgs || {}
        message.arguments[0].withArgs = [{ args, requester: kite.id }]
      }
    }

    super.handleMessage(proto, message)
  }

  listen(port = PORT) {
    super.listen(port)
    this.server.on('connection', this.bound('registerConnection'))
    this.ropeApi.logConnections()
  }

  registerConnection(connection) {
    const headers = connection.connection.headers || {}
    const connectedFrom =
      headers['x-forwarded-for'] || connection.connection.remoteAddress

    if (this.ctx.blackList.has(connectedFrom)) {
      this.logger.debug('connection request from blacklisted ip', connectedFrom)
      connection.close()
      return
    }

    const connectionId = connection.getId()
    const { kite } = connection

    kite
      .tell('rope.identify', connectionId)
      .then(info => {
        this.logger.debug('kiteinfo', info)
        const { kiteInfo, useragent, api = [], signatures = {} } = info
        const { id: kiteId } = kiteInfo

        this.logger.info('A new kite registered with ID of', kiteId)

        const identifyData = { id: kiteId, connectedFrom }

        if (kiteInfo.environment == 'Browser' && useragent) {
          let { browser } = uaParser(useragent)
          let environment = `${browser.name} ${browser.version}`
          kiteInfo.environment = identifyData.environment = environment
        }
        kite.tell('rope.identified', [identifyData])

        this.ctx.connections.set(kiteId, {
          api,
          kite,
          headers,
          kiteInfo,
          signatures,
          connectedFrom: remoteIp,
        })

        this.ropeApi.notifyNodes('node.added', { kiteId })
        this.ropeApi.logConnections()

        connection.on('close', () => {
          this.logger.info('A kite left the facility :(', kiteId)
          this.ctx.connections.delete(kiteId)
          this.ropeApi.unsubscribeFromAll(kiteId)
          this.ropeApi.notifyNodes('node.removed', { kiteId })
          this.ropeApi.logConnections()
        })
        return info
      })
      .catch(err => {
        this.logger.error('Error while register connection', err)
        this.logger.info('Dropping outdated kite', connectionId, connectedFrom)
        this.ctx.blackListCandidates[connectedFrom] |= 0
        this.ctx.blackListCandidates[connectedFrom]++

        if (this.ctx.blackListCandidates[connectedFrom] > BLACKLIST_LIMIT) {
          this.logger.info(`Connections from ${connectedFrom} blacklisted`)
          this.ctx.blackList.add(connectedFrom)
        }

        connection.close()
      })
  }
}
