import pkg from '../package.json'
import * as constants from './constants'

describe('constants', () =>
  test('should expose required constants', () => {
    expect(constants.MAX_QUERY_LIMIT).toBeDefined()
    expect(constants.BLACKLIST_LIMIT).toBeDefined()
    expect(constants.LOG_LEVEL).toBeDefined()
    expect(constants.AUTH).toBeDefined()
    expect(constants.PORT).toBeDefined()
  }))
