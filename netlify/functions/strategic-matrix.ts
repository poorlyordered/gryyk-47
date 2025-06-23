import { Handler } from '@netlify/functions';
import { MongoClient, ObjectId } from 'mongodb';
<<<<<<< HEAD
=======
import { authenticateEveUser } from './auth-middleware';
>>>>>>> 1ed7324 (Initial commit)

// Ensure environment variables are loaded
const MONGODB_URI = process.env.MONGODB_URI;
// EVE Online credentials are imported but not used in this simplified version
// They would be used in a real implementation for token verification
// const EVE_CLIENT_ID = process.env.EVE_CLIENT_ID;
// const EVE_CLIENT_SECRET = process.env.EVE_CLIENT_SECRET;

<<<<<<< HEAD
// Authentication middleware
const authenticateUser = async (headers: { [key: string]: string | undefined }) => {
  // Get the authorization header
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // Extract the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Missing token');
  }

  // In a real implementation, you would verify the token with EVE Online SSO
  // For now, we'll just return a mock user ID
  return {
    userId: 'mock-user-id',
    // Add other user information as needed
  };
};

=======
>>>>>>> 1ed7324 (Initial commit)
export const handler: Handler = async (event) => {
  // Basic error checking for environment variables
  if (!MONGODB_URI) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'MongoDB URI not configured' }) 
    };
  }

  try {
    // Authenticate the user
<<<<<<< HEAD
    let user;
    try {
      user = await authenticateUser(event.headers);
=======
    try {
      await authenticateEveUser(event.headers);
>>>>>>> 1ed7324 (Initial commit)
    } catch (authError) {
      console.error('Authentication error:', authError);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const database = client.db('Gryyk-47');
    const strategicMatrixCollection = database.collection('strategic-matrix');

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        // Fetch documents for the authenticated user
        const documents = await strategicMatrixCollection.find({
<<<<<<< HEAD
          userId: user.userId
=======
          corporationId: event.queryStringParameters?.corporationId,
          ...(event.queryStringParameters?.documentType
            ? { documentType: event.queryStringParameters.documentType }
            : {})
>>>>>>> 1ed7324 (Initial commit)
        }).toArray();
        
        await client.close();
        return {
          statusCode: 200,
          body: JSON.stringify(documents)
        };
      }

      case 'POST': {
        // Create a new document
        const newDocument = JSON.parse(event.body || '{}');
        
        // Add user ID and timestamp
<<<<<<< HEAD
        newDocument.userId = user.userId;
        newDocument.lastUpdated = new Date();
=======
        newDocument.corporationId = newDocument.corporationId || event.queryStringParameters?.corporationId;
        newDocument.createdAt = new Date();
        newDocument.updatedAt = new Date();
>>>>>>> 1ed7324 (Initial commit)
        
        const result = await strategicMatrixCollection.insertOne(newDocument);
        
        await client.close();
        return {
          statusCode: 201,
          body: JSON.stringify({
            id: result.insertedId,
            ...newDocument
          })
        };
      }

      case 'PUT': {
        // Update an existing document
        const updateData = JSON.parse(event.body || '{}');
        const documentId = event.path.split('/').pop();
        
        if (!documentId) {
          return { 
            statusCode: 400, 
            body: JSON.stringify({ error: 'Document ID is required' }) 
          };
        }
        
        // Ensure the user can only update their own documents
        const updateResult = await strategicMatrixCollection.updateOne(
<<<<<<< HEAD
          { _id: new ObjectId(documentId), userId: user.userId },
          { 
            $set: {
              ...updateData,
              lastUpdated: new Date()
=======
          { _id: new ObjectId(documentId), corporationId: updateData.corporationId, documentType: updateData.documentType },
          { 
            $set: {
              ...updateData,
              updatedAt: new Date()
>>>>>>> 1ed7324 (Initial commit)
            } 
          }
        );
        
        await client.close();
        
        if (updateResult.matchedCount === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Document not found or access denied' })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      }

      case 'DELETE': {
        // Delete a document
        const deleteId = event.path.split('/').pop();
        
        if (!deleteId) {
          return { 
            statusCode: 400, 
            body: JSON.stringify({ error: 'Document ID is required' }) 
          };
        }
        
        // Ensure the user can only delete their own documents
        const deleteResult = await strategicMatrixCollection.deleteOne({
          _id: new ObjectId(deleteId),
<<<<<<< HEAD
          userId: user.userId
=======
          corporationId: event.queryStringParameters?.corporationId,
          documentType: event.queryStringParameters?.documentType
>>>>>>> 1ed7324 (Initial commit)
        });
        
        await client.close();
        
        if (deleteResult.deletedCount === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Document not found or access denied' })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      }

      default:
        await client.close();
        return { 
          statusCode: 405, 
          body: JSON.stringify({ error: 'Method Not Allowed' }) 
        };
    }
  } catch (error) {
    console.error('Server error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal Server Error' }) 
    };
  }
};
