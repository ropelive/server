export default class RopeContext {
  constructor() {
    this.connections = new Map()
    this.events = new Map([
      ['node.exec', new Set()],
      ['node.added', new Set()],
      ['node.removed', new Set()],
    ])
    this.execHistory = new Array()
    this.blackListCandidates = new Object()
    this.blackList = new Set()
  }

  getKiteDetails(kiteId) {
    let connection = this.connections.get(kiteId)

    if (!connection) {
      return { id: kiteId }
    }

    let { api, signatures, connectedFrom, type, kiteInfo } = connection
    return { id: kiteId, api, signatures, connectedFrom, kiteInfo, type }
  }
}
