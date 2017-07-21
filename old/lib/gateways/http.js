const {send, json} = require('micro')
const URL = require('url')
const {matchPattern} = require('../utils/pattern')

/**
 * this is a micro handler, see https://github.com/zeit/micro
 *
 * api example:
 * POST http://domain/prefix/(request|notify)/topic
 * body: JSON
 *
 * @param broker
 * @param [prefix]
 * @param [whiteTopics]
 * @param [blackTopics]
 * @param [parseInput] - func(input) => parsedInput
 * @param [parseOutput] - function(output) => parsedOutput
 * @param [errorHandler] - async func(err, req, res)
 */
module.exports = ({broker, prefix, whiteTopics, blackTopics, parseInput = identity, parseOutput = identity, errorHandler = defaultErrorHandler}) => async (req, res) => {
  const result = matchUrl(req.url, {prefix})
  if (!result) return send(res, 404, 'Not Found')
  let {type, topic} = result

  if (whiteTopics) {
    if (!whiteTopics.some(whiteTopic => matchPattern(whiteTopic, topic))) {
      return send(res, 403, 'Forbidden')
    }
  }

  if (blackTopics) {
    if (blackTopics.some(blackTopic => matchPattern(blackTopic, topic))) {
      return send(res, 403, 'Forbidden')
    }
  }

  const input = parseInput(await json(req))

  try {
    if (type === 'notify') {
      await broker.notify(topic, input)
      return send(res, 201)
    }
    else {
      const output = parseOutput(await broker.request(topic, input))
      return send(res, 200, output)
    }
  }
  catch (err) {
    await errorHandler(err, req, res)
  }
}

function matchUrl (rawUrl, {prefix = ''}) {
  const url = URL.parse(rawUrl)
  const matches = url.pathname.match(new RegExp(`^${prefix}/(request|notify)/(.+)`))
  if (!matches) return
  const [_, type, topic] = matches
  return {type, topic}
}

function identity (input) {return input}

function defaultErrorHandler (err) {throw err}

