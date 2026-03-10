const db = require('../config/database');
const { producer } = require('../config/kafka');
const csv = require('csv-parser');
const { Readable } = require('stream');

class UploadService {
  async processCSV(fileBuffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const readableStream = Readable.from(fileBuffer.toString());
      
      readableStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async saveToDatabase(records) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const savedRecords = [];
      
      for (const record of records) {
        const query = `
          INSERT INTO records (name, email, phone, address)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const values = [record.name, record.email, record.phone, record.address];
        const result = await client.query(query, values);
        savedRecords.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return savedRecords;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async publishEvent(records) {
    await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          key: Date.now().toString(),
          value: JSON.stringify({
            event: 'UPLOAD_COMPLETED',
            timestamp: new Date().toISOString(),
            records: records
          })
        }
      ]
    });
  }
}

module.exports = new UploadService();