import type { Handler } from '@netlify/functions';
import { MongoClient, ObjectId, Sort } from 'mongodb';

// Message type definition (local to avoid import issues in Netlify)
interface Message {
  messageId: string;
  sessionId: string;
  corpId: string;
  sender: string;
  content: string;
  timestamp: string;
  references: string[];
  tags: string[];
  threadId?: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// MongoDB connection with connection pooling
const MONGODB_URI = 'mongodb+srv://netgleb:zzNvxXyOLBOeKqdM@gryyk-47.hsipgxw.mongodb.net/?retryWrites=true&w=majority&appName=Gryyk-47';
const DB_NAME = 'gryyk47';
const COLLECTION = 'messages';

// Reuse MongoDB client across function invocations (connection pooling)
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  });

  await client.connect();
  cachedClient = client;
  return client;
}

// Authentication middleware - simplified for now
const authenticateRequest = async () => {
  // In a real implementation, this would verify the JWT token
  // For now, we'll just return a mock authenticated result
  return {
    isAuthenticated: true,
    characterId: '12345678'
  };
};

const handler: Handler = async (event) => {
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Authenticate the request
  const authResult = await authenticateRequest();
  if (!authResult.isAuthenticated) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    // Get messages
    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const filter: Record<string, unknown> = {};

      // Apply filters if provided
      if (queryParams.sessionId) {
        filter.sessionId = queryParams.sessionId;
      }

      if (queryParams.corpId) {
        filter.corpId = queryParams.corpId;
      }

      if (queryParams.threadId) {
        filter.threadId = queryParams.threadId;
      }

      if (queryParams.tag) {
        filter.tags = { $in: [queryParams.tag] };
      }

      // Pagination
      const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
      const skip = queryParams.skip ? parseInt(queryParams.skip) : 0;

      // Sort by timestamp descending (newest first)
      const sort: Sort = { timestamp: -1 };

      // Optimize query with projection and index hint
      const messages = await collection.find(filter, {
        maxTimeMS: 25000, // 25 second timeout for MongoDB query
      })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(messages)
      };
    }
    
    // Create message
    else if (event.httpMethod === 'POST') {
      const messageData = JSON.parse(event.body || '{}');
      
      // Validate required fields
      if (!messageData.sessionId || !messageData.content || !messageData.sender) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      // Create a new message
      const newMessage: Omit<Message, 'messageId'> & { _id?: ObjectId } = {
        sessionId: messageData.sessionId,
        corpId: messageData.corpId || authResult.characterId || 'unknown',
        sender: messageData.sender,
        content: messageData.content,
        timestamp: new Date().toISOString(),
        references: messageData.references || [],
        tags: messageData.tags || [],
        threadId: messageData.threadId
      };
      
      const result = await collection.insertOne(newMessage);
      
      // Convert the MongoDB document to our Message type
      const createdMessage: Message = {
        messageId: result.insertedId.toString(),
        sessionId: newMessage.sessionId,
        corpId: newMessage.corpId,
        sender: newMessage.sender,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        references: newMessage.references,
        tags: newMessage.tags,
        threadId: newMessage.threadId
      };
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(createdMessage)
      };
    }
    
    // Update message
    else if (event.httpMethod === 'PUT') {
      const messageData = JSON.parse(event.body || '{}');
      const { messageId } = messageData;
      
      if (!messageId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing messageId' })
        };
      }
      
      // Remove fields that shouldn't be updated
      delete messageData.messageId;
      delete messageData._id;
      
      // Update the message
      const result = await collection.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: messageData }
      );
      
      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Message not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, messageId })
      };
    }
    
    // Delete message
    else if (event.httpMethod === 'DELETE') {
      const { messageId } = event.queryStringParameters || {};
      
      if (!messageId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing messageId' })
        };
      }
      
      const result = await collection.deleteOne({ _id: new ObjectId(messageId) });
      
      if (result.deletedCount === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Message not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, messageId })
      };
    }
    
    // Method not allowed
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
  // Note: Don't close the client - keep connection pool alive for reuse
};

export { handler }; 