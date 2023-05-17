/* eslint-disable jsdoc/require-jsdoc */
import { calculateSimilarity } from './calculateUserSimilarity.js'

export async function calculateMovieSimilarity (req, res, next) {
  const simscores = await calculateSimilarity(req, res, next)
  const calcws = await calcWeightedScore(simscores, req, res, next)
  const calcWeightedScoreSum = await calculateWeightedScoreSum(calcws)

  for (let i = 0; i < calcWeightedScoreSum.length; i++) {
    calcWeightedScoreSum[i].simSum = 0

    for (let j = 0; j < simscores.length; j++) {
      for (let k = 0; k < calcWeightedScoreSum[i].seenBy.length; k++) {
        if (simscores[j].userId === calcWeightedScoreSum[i].seenBy[k]) {
          calcWeightedScoreSum[i].simSum += simscores[j].simScore
        }
      }
    }
  }

  return await movieRecommendation(calcWeightedScoreSum)
}

async function movieRecommendation (similarities) {
  for (let i = 0; i < similarities.length; i++) {
    similarities[i].recScore = (similarities[i].weightedScoreSum / similarities[i].simSum).toFixed(4)
  }

  similarities.sort(function (a, b) {
    return a.recScore - b.recScore
  })

  return similarities.reverse()
}

export async function calcWeightedScore (simscores, req, res, next) {
  const allRatings = await getRatings(req, res, next) // userId:movieId:Rating
  const allMovies = await getMovies(req, res, next)

  // Remove movies user has already seen
  for (let i = 0; i < allRatings.length; i++) {
    for (let j = 0; j < allMovies.length; j++) {
      if (req.body.userId === allRatings[i].key[0]) {
        if (allRatings[i].key[1] === allMovies[j].key[0]) {
          allMovies.splice(j, 1)
        }
      }
    }
  }

  const weightedscores = []
  for (let i = 0; i < allMovies.length; i++) {
    for (let j = 0; j < simscores.length; j++) {
      // exclude zero or negative similarity
      if (simscores[j].simScore > 0) {
        for (const e of allRatings) {
          // compare user ids
          if (e.key[0] === simscores[j].userId) {
            // compare movie ids
            if (e.key[1] === allMovies[i].key[0]) {
              const weight = e.key[2] * simscores[j].simScore

              weightedscores.push({
                userId: simscores[j].userId,
                name: simscores[j].name,
                movieId: e.key[1],
                movieTitle: allMovies[i].key[1],
                weightScore: weight
              })
            }
          }
        }
      }
    }
  }

  return weightedscores
}

export async function calculateWeightedScoreSum (weightScores) {
  const weightSum = []
  let seenBy = []

  let sum = 0
  weightScores.reduce((prev, curr, i) => {
    const score = parseFloat(curr.weightScore)
    const id = curr.userId

    if (curr.movieId === prev.movieId || sum === 0) {
      // push the user id of users who have seen the movie.
      seenBy.push(id)
      sum += score
    } else {
      weightSum.push({ movieId: prev.movieId, movieTitle: prev.movieTitle, weightedScoreSum: sum, seenBy })
      seenBy = []
      seenBy.push(id)
      sum = 0
      sum += score
    }

    // Ensure last sum gets pushed.
    if (i === weightScores.length - 1) {
      weightSum.push({ movieId: curr.movieId, movieTitle: curr.movieTitle, weightedScoreSum: sum, seenBy })
    }

    return curr
  }, [])

  return weightSum
}

async function getMovies (req, res, next) {
  const movies = await req.app.es.search({
    aggs: {
      docker: {
        multi_terms: {
          terms: [{ field: 'MovieId.keyword' }, { field: 'Title.keyword' }, { field: 'Year.keyword' }], size: 1000
        }
      }
    }
  })

  return movies.aggregations.docker.buckets
}

async function getRatings (req, res, next) {
  const ratings = await req.app.es.search({
    aggs: {
      docker: {
        multi_terms: {
          terms: [{ field: 'UserId.keyword' }, { field: 'MovieId.keyword' }, { field: 'Rating.keyword' }], size: 1000
        }
      }
    }
  })

  return ratings.aggregations.docker.buckets
}
