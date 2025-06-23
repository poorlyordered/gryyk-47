/**
 * MongoDB Connection Test Script
 *
 * This script tests the connection to MongoDB Atlas and performs basic CRUD operations
 * to verify that everything is working properly.
 */

import { MongoClient } from 'mongodb';

// MongoDB Atlas connection URI - now loaded from environment variable
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set. Please set it in your .env file.');
}
const dbName = 'gryyk47';

async function testConnection() {
  console.log('Testing MongoDB Atlas connection...');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // 5 seconds
    connectTimeoutMS: 10000, // 10 seconds
  });
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Get database information
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    console.log(`\nDatabase: ${dbName}`);
    console.log('Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Test a simple write operation
    console.log('\nTesting write operation...');
    const testCollection = db.collection('connection_tests');
    const result = await testCollection.insertOne({
      test: 'connection',
      timestamp: new Date(),
      status: 'success'
    });
    
    console.log(`✅ Write operation successful! Inserted document with ID: ${result.insertedId}`);
    
    // Test a simple read operation
    console.log('\nTesting read operation...');
    const document = await testCollection.findOne({ test: 'connection' });
    console.log('✅ Read operation successful!');
    console.log('Retrieved document:', document);
    
    // Test update operation
    console.log('\nTesting update operation...');
    const updateResult = await testCollection.updateOne(
      { test: 'connection' },
      { $set: { updated: true, updateTimestamp: new Date() } }
    );
    console.log(`✅ Update operation successful! Modified ${updateResult.modifiedCount} document(s)`);
    
    // Verify update
    const updatedDocument = await testCollection.findOne({ test: 'connection' });
    console.log('Updated document:', updatedDocument);
    
    // Clean up - delete the test document
    console.log('\nCleaning up test data...');
    const deleteResult = await testCollection.deleteMany({ test: 'connection' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} test document(s)`);
    
    console.log('\n✅ All MongoDB operations completed successfully!');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
    
    // Print more detailed error information
    if (err.name === 'MongoServerSelectionError') {
      console.error('\nDetailed error information:');
      console.error('- Error name:', err.name);
      console.error('- Error message:', err.message);
      console.error('- Error code:', err.code);
      
      if (err.reason) {
        console.error('- Topology type:', err.reason.type);
        console.error('- Server descriptions:', [...err.reason.servers.entries()]);
      }
      
      console.error('\nPossible causes:');
      console.error('1. Network connectivity issues');
      console.error('2. MongoDB Atlas IP whitelist restrictions');
      console.error('3. Incorrect connection string');
      console.error('4. MongoDB Atlas service might be down');
      
      console.error('\nTroubleshooting steps:');
      console.error('1. Check your internet connection');
      console.error('2. Verify the connection string in your MongoDB Atlas dashboard');
      console.error('3. Ensure your IP address is whitelisted in MongoDB Atlas');
      console.error('4. Check MongoDB Atlas status page for any service disruptions');
    }
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
testConnection().catch(console.error); 