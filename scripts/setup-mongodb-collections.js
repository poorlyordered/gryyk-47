/**
 * MongoDB Collection Setup Script
 *
 * This script creates the collections and indexes for the Gryyk-47 Strategic Context
 * based on the schemas defined in strategic_context_schemas.md
 */

import { MongoClient } from 'mongodb';

// MongoDB Atlas connection URI - now loaded from environment variable
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set. Please set it in your .env file.');
}
const dbName = 'gryyk47'; // The database name to use in MongoDB Atlas

// Collection names
const collections = [
  'corporation_context',
  'active_context',
  'asset_information',
  'diplomatic_relations',
  'operational_details',
  'threat_analysis',
  'opportunity_assessment',
  'session_context'
];

// Indexes to create
const indexes = {
  'corporation_context': [
    { key: { corpId: 1 }, unique: true }
  ],
  'active_context': [
    { key: { corpId: 1 }, unique: false },
    { key: { timestamp: -1 }, unique: false }
  ],
  'asset_information': [
    { key: { corpId: 1 }, unique: true }
  ],
  'diplomatic_relations': [
    { key: { corpId: 1 }, unique: true }
  ],
  'operational_details': [
    { key: { corpId: 1 }, unique: true }
  ],
  'threat_analysis': [
    { key: { corpId: 1 }, unique: true }
  ],
  'opportunity_assessment': [
    { key: { corpId: 1 }, unique: true }
  ],
  'session_context': [
    { key: { sessionId: 1 }, unique: true },
    { key: { corpId: 1 }, unique: false },
    { key: { startTime: -1 }, unique: false }
  ]
};

async function setupCollections() {
  console.log(`Connecting to MongoDB at ${uri}...`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Create collections
    for (const collectionName of collections) {
      try {
        console.log(`Creating collection: ${collectionName}`);
        await db.createCollection(collectionName);
        console.log(`Collection ${collectionName} created successfully`);
      } catch (err) {
        // Collection might already exist
        if (err.code === 48) {
          console.log(`Collection ${collectionName} already exists`);
        } else {
          console.error(`Error creating collection ${collectionName}:`, err);
        }
      }
      
      // Create indexes for the collection
      if (indexes[collectionName]) {
        for (const indexSpec of indexes[collectionName]) {
          try {
            console.log(`Creating index on ${collectionName}: ${JSON.stringify(indexSpec.key)}`);
            await db.collection(collectionName).createIndex(indexSpec.key, {
              unique: indexSpec.unique || false
            });
            console.log(`Index created successfully on ${collectionName}`);
          } catch (err) {
            console.error(`Error creating index on ${collectionName}:`, err);
          }
        }
      }
    }
    
    console.log('All collections and indexes have been set up successfully');
  } catch (err) {
    console.error('Error setting up MongoDB collections:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the setup
setupCollections().catch(console.error);