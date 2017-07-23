const {makeError} = require('error-utils')

module.exports = {
  BrokerError: makeError('BrokerError'),
  RemoteMethodError: makeError('RemoteMethodError')
}