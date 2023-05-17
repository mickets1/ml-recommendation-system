/* eslint-disable jsdoc/require-jsdoc */
import { euclideanDistance, sort } from './euclidianDistance.js'
import { pearson } from './pearson.js'

export async function calculateSimilarity (req, res, next) {
  const matches = []

  const userA = await req.app.es.search({
    size: 1000,
    index: 'docker',
    query: {
      match: { UserId: parseInt(req.body.userId) }
    }
  })

  let uid = 1
  while (true) {
    const userB = await req.app.es.search({
      size: 1000,
      index: 'docker',
      query: {
        match: { UserId: uid }
      }
    })

    // No more users
    if (userB.hits.total.value === 0) {
      break
    }

    // Exclude user A
    if (userB.hits.hits[0]._source.UserId !== req.body.userId) {
      const user = userB.hits.hits[userB.hits.hits.length - 1]._source

      if (req.body.simMtd === '2') {
        matches.push({
          userId: user.UserId,
          name: user.Name,
          simScore: await pearson(userA, userB)
        })
      } else if (req.body.simMtd === '1') {
        matches.push({
          userId: user.UserId,
          name: user.Name,
          simScore: await euclideanDistance(userA, userB)
        })
      }
    }

    uid++
  }

  // Max 100 results if user doesn't provide number of results.
  if (req.body.num === null) {
    req.body.num = 100
  }

  const sortedMatches = await sort(matches)
  return sortedMatches
}
