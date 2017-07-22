const micro = require('micro')
const {send, text} = require('micro')
const URL = require('url')
const {errorToObject} = require('error-utils')

module.exports = ({broker, allow = () => true, prefix = '', logger = console, displayError = errorToObject}) => micro(async (req, res) => {
  const result = matchUrl(req.url, {prefix})
  if (!result) return send(res, 404, 'not found')

  const {type, name} = result
  if (!allow(type, name)) {
    return send(res, 403, 'forbidden')
  }

  let input
  try {
    input = await text(req)
    if (input === undefined || input === '') input = undefined
    else input = input = JSON.parse(input)
  }
  catch (err) {
    logger.error(err)
    return send(res, 400, 'body should be valid JSON')
  }

  try {
    switch (type) {
      case 'call': {
        const output = await broker.call(name, input)
        return send(res, 200, JSON.stringify(output))
      }
      case 'emit': {
        await broker.emit(name, input)
        return send(res, 201)
      }
      default: {
        return send(res, 422, `invalid action type: ${type}`)
      }
    }
  }
  catch (err) {
    logger.error(err)
    return send(res, 500, displayError(err))
  }
})

function matchUrl (rawUrl, {prefix}) {
  const url = URL.parse(rawUrl)
  const matches = url.pathname.match(new RegExp(`^${prefix}/(call|emit)/(.+)`))
  if (!matches) return
  const [_, type, name] = matches
  return {type, name}
}
