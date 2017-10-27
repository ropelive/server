export default class RopeContext {
  constructor() {
    this.connections = new Map()
    this.events = new Map([
      ['node.added', new Set()],
      ['node.removed', new Set()],
    ])

    this.blackListCandidates = new Object()
    this.blackList = new Set()
  }

  getKiteDetails(kiteId) {
    let connection = this.connections.get(kiteId)

    if (!connection) {
      return { id: kiteId }
    }

    let { api, signatures, connectedFrom, kiteInfo } = connection
    return { id: kiteId, api, signatures, connectedFrom, kiteInfo }
  }
}
