module.exports = {
  matchPattern (pattern, topic) {
    const patternTokens = pattern.split('.')
    const topicTokens = topic.split('.')

    for (let i = 0; i < patternTokens.length; i++) {
      const patternToken = patternTokens[i]
      const topicToken = topicTokens[i]
      if (patternToken === '>') {
        return !!topicToken
      }
      else if (patternToken === '*') {
        if (!topicToken) return false
      }
      else if (patternToken !== topicToken) {
        return false
      }
    }

    return topicTokens.length === patternTokens.length
  }
}