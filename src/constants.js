export const AUTH_SERVER = process.env.AUTH_SERVER || 'https://rope.live'
export const MAX_QUERY_LIMIT = 200
export const MAX_EVENT_LIMIT = 200
export const BLACKLIST_LIMIT = 10
export const LOG_LEVEL = process.env.ROPE_DEBUG || 0
export const PORT = 3210
export const AUTH = false
export const TYPES = [
  ['firefox', /firefox/i],
  ['safari', /safari/i],
  ['chrome', /chrom/i],
  ['opera', /opera/i],
  ['edge', /^edge/i],
  ['js', /^node\.js/i],
  ['go', /^go/i],
]
