/* eslint-disable jsdoc/require-jsdoc */
import { calculateMovieSimilarity } from '../utils/CalculateMovieRecommendation.js'
import { calculateSimilarity } from '../utils/calculateUserSimilarity.js'

/**
 * Similarity
 */
export class SimilarityController {
  async index (req, res, next) {
    return res.json('Empty')
  }

  async movieRecommendations (req, res, next) {
    // Slice based on number of results wanted by user.
    const result = await calculateMovieSimilarity(req, res, next)
    res.json(result.slice(0, req.body.num))
  }

  async topUsers (req, res, next) {
    const result = await calculateSimilarity(req, res, next)
    res.json(result.slice(0, req.body.num))
  }

  // username + userid aggregation
  async users (req, res, next) {
    try {
      const users = await req.app.es.search({
        aggs: {
          docker: {
            multi_terms: {
              terms: [{ field: 'Name.keyword' }, { field: 'UserId.keyword' }], size: 10000
            }
          }
        }
      })
      res.json(users)
    } catch (e) {
      console.error(e)
    }
  }
}
