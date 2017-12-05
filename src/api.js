import { TYPES, MAX_EVENT_LIMIT, MAX_QUERY_LIMIT, LOG_LEVEL } from './constants'
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
    const { method, region } = args
    let res = []

    if (method || region) {
      for (let [kiteId, connection] of this.ctx.connections) {
        if (connection.api.includes(method)) {
          if (region) {
            if (connection.kiteInfo.region == region) {
              res.push(kiteId)
            }
          } else {
            res.push(kiteId)
          }
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
    let res = { total: this.ctx.connections.size }

    for (let [type] of TYPES) {
      res[type] = 0
    }

    for (let [kiteId, connection] of this.ctx.connections) {
      res[connection.type]++
    }

    callback(null, res)
  }

  @shareAs('run')
  runOnKite(options, callback) {
    let { requester, args: { kiteId, method, args = [] } } = options

    if (!method || /^rope\./.test(method)) {
      return callback({ message: 'Method is not valid' })
    }

    if (!kiteId) {
      let kites = this.filterByMethod(method)
      kiteId = kites[Math.floor(Math.random() * kites.length)]
    }

    if (!kiteId) {
      return callback({ message: 'No kite available' })
    }

    this.addToExecHistory({
      from: requester,
      to: kiteId,
      method,
    })

    this.logger.debug(`going to call ${method} on ${kiteId}`)
    this.logger.debug('args were:', args)

    this.ctx.connections
      .get(kiteId)
      .kite.tell(method, args)
      .then(res => {
        this.logger.debug('got response success:', res)
        callback(null, res)
      })
      .catch(err => {
        this.logger.debug('got response fail:', err)
        callback(err)
      })
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
        message: `Now unsubscribed from ${eventName}`,
      })
    )
  }

  @share
  history(options, callback) {
    let { skip = 0, limit = 10 } = options.args
    callback(null, this.ctx.execHistory.slice(skip, skip + limit))
  }

  addToExecHistory(execEvent) {
    execEvent.time = Date.now()
    this.notifyNodes('node.exec', execEvent)
    if (this.ctx.execHistory.unshift(execEvent) > MAX_EVENT_LIMIT)
      this.ctx.execHistory.pop()
  }

  filterByMethod(method) {
    let res = []
    for (let [kiteId, connection] of this.ctx.connections) {
      if (connection.api.includes(method)) {
        res.push(kiteId)
      }
      if (res.length >= MAX_QUERY_LIMIT) break
    }
    return res
  }

  notifyNodes(event, data) {
    const notification = { event }

    if (data.kiteId) {
      notification.kiteInfo = this.ctx.getKiteDetails(data.kiteId)
      delete data.kiteId
    }

    notification.data = data
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
      return [
        {
          message: `Notifications not supported for this node,
                    please provide a method named "rope.notify"
                    in the API first.`,
        },
      ]
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
