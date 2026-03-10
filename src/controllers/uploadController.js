const uploadService = require('../services/uploadService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

class UploadController {
  async uploadCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Check file type
      if (!req.file.originalname.endsWith('.csv')) {
        return res.status(400).json({
          success: false,
          error: 'Only CSV files are allowed'
        });
      }

      // Process CSV
      const records = await uploadService.processCSV(req.file.buffer);
      
      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'CSV file is empty'
        });
      }

      // Save to database
      const savedRecords = await uploadService.saveToDatabase(records);
      
      // Publish Kafka event
      await uploadService.publishEvent(savedRecords);
      
      return res.status(200).json({
        success: true,
        message: 'File processed successfully',
        data: {
          recordsProcessed: savedRecords.length,
          records: savedRecords
        }
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  getUploadMiddleware() {
    return upload.single('file');
  }
}

module.exports = new UploadController();