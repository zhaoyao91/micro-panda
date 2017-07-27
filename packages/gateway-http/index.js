const micro = require('micro')
const {send, text} = require('micro')
const URL = require('url')

module.exports = ({broker, allow = () => true, prefix = '', logger = console}) => micro(async (req, res) => {
  if (!allow(req)) {
    return send(res, 403, 'forbidden')
  }

  const result = matchUrl(req.url, {prefix})
  if (!result) return send(res, 404, 'not found')

  const {type, name} = result

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
        res.setHeader('Content-Type', 'application/json')
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
    return send(res, 500, err)
  }
})

function matchUrl (rawUrl, {prefix}) {
  const url = URL.parse(rawUrl)
  const matches = url.pathname.match(new RegExp(`^${prefix}/(call|emit)/(.+)`))
  if (!matches) return
  const [_, type, name] = matches
  return {type, name}
}
