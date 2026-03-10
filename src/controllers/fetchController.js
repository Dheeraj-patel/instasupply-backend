const fetchService = require('../services/fetchService');

class FetchController {
  async getAllRecords(req, res) {
    try {
      const result = await fetchService.getAllRecords();
      
      return res.status(200).json({
        success: true,
        fromCache: result.fromCache,
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
    }
    async clearCache(req, res) {
  try {
    await fetchService.clearCache();
    return res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
}

module.exports = new FetchController();