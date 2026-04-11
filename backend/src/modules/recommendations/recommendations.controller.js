import * as recommendationsService from "./recommendations.service.js";

export async function getRecommendations(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const recommendations = await recommendationsService.generateRecommendations(startDate, endDate);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
}

export async function getRecommendationHistory(req, res, next) {
  try {
    const { limit } = req.query;
    
    const history = await recommendationsService.getRecommendationHistory(
      limit ? Number(limit) : 50
    );
    
    res.json(history);
  } catch (err) {
    next(err);
  }
}
