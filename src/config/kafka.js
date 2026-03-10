const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID });

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka producer connected');
};

const connectConsumer = async () => {
  await consumer.connect();
  console.log('Kafka consumer connected');
};

module.exports = { kafka, producer, consumer, connectProducer, connectConsumer };