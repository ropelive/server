import { MAX_QUERY_LIMIT, LOG_LEVEL } from './constants'
import readline from 'readline'

function __share(target, name, method, as) {
  if (!target.methods) {
    target.methods = new Object()
  }
  target.methods[as || name] = name
}

function share(target, name) {
  __share(target, name, target[name])
}

function shareAs(as) {
  return (target, name) => {
    __share(target, name, target[name], as)
  }
}

export default class RopeApi {
  constructor(delegate) {
    this.ctx = delegate.ctx
    this.logger = delegate.logger
    this.delegate = delegate
  }

  getMethods() {
    let methods = {}
    for (let method in this.methods) {
      methods[method] = this[this.methods[method]].bind(this)
    }
    return methods
  }

  @shareAs('query')
  queryKite({ args, requester }, callback) {
    const method = args.method
    let res = []

    if (method) {
      for (let [kiteId, connection] of this.ctx.connections) {
        if (connection.api.includes(method)) {
          res.push(kiteId)
        }
        if (res.length >= MAX_QUERY_LIMIT) break
      }
    } else {
      res = Array.from(this.ctx.connections.keys()).slice(0, MAX_QUERY_LIMIT)
      if (res.indexOf(requester) < 0) res[0] = requester
    }

    res = res.map(kiteId => this.ctx.getKiteDetails(kiteId))
    callback(null, res)
  }

  @shareAs('count')
  getKiteCount(options, callback) {
    callback(null, this.ctx.connections.size)
  }

  @shareAs('run')
  runOnKite(options, callback) {
    const { kiteId, method, args = [] } = options.args

    this.ctx.connections
      .get(kiteId)
      .kite.tell(method, args)
      .then(res => callback(null, res))
      .catch(err => callback(err))
  }

  @share
  subscribe({ args: eventName, requester }, callback) {
    callback.apply(
      this,
      this.handleSubscription({
        eventName,
        requester,
        subscribe: true,
        message: `Now subscribed to ${eventName}`,
      })
    )
  }

  @share
  unsubscribe({ args: eventName, requester }, callback) {
    callback.apply(
      this,
      this.handleSubscription({
        eventName,
        requester,
        subscribe: false,
        message: `Now ubsubscribed from ${eventName}`,
      })
    )
  }

  notifyNodes(event, kiteId) {
    const kiteInfo = this.ctx.getKiteDetails(kiteId)
    const notification = { event, kiteInfo }

    this.logger.info('notifying', this.ctx.events.get(event))

    for (let node of this.ctx.events.get(event)) {
      this.ctx.connections.get(node).kite.tell('rope.notify', notification)
    }
  }

  getSubscribers(eventName) {
    const subscribers = this.ctx.events.get(eventName)
    if (!subscribers) return [{ message: 'Event not supported!' }]
    return [null, subscribers]
  }

  handleSubscription({ requester, eventName, message, subscribe }) {
    var [err, connection] = this.getConnection(requester)
    if (err) return [err]

    var [err, subscribers] = this.getSubscribers(eventName)
    if (err) return [err]

    if (subscribe) subscribers.add(requester)
    else subscribers.delete(requester)

    this.ctx.events.set(eventName, subscribers)

    this.logger.debug('events now', this.ctx.events.entries())
    return [null, message]
  }

  unsubscribeFromAll(kiteId) {
    let event, subscribers
    for ([event, subscribers] of this.ctx.events) {
      subscribers.delete(kiteId)
      this.ctx.events.set(event, subscribers)
    }
    this.logger.debug('events now', this.ctx.events.entries())
  }

  getConnection(requester) {
    const connection = this.ctx.connections.get(requester)
    if (!connection || !connection.api.includes('rope.notify'))
      return [{ message: 'Notifications not supported for this node' }]
    return [null, connection]
  }

  logConnections() {
    if (LOG_LEVEL == 0) {
      process.stdout.write(`\rConnected kites ${this.ctx.connections.size}   `)
      readline.cursorTo(process.stdout, 0)
    } else {
      this.logger.info('Connected kites', this.ctx.connections.size)
    }
  }
}
