"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const mongodb_1 = require("mongodb");
// Ensure environment variables are loaded
const MONGODB_URI = process.env.MONGODB_URI;
// EVE Online credentials are imported but not used in this simplified version
// They would be used in a real implementation for token verification
// const EVE_CLIENT_ID = process.env.EVE_CLIENT_ID;
// const EVE_CLIENT_SECRET = process.env.EVE_CLIENT_SECRET;
// Authentication middleware
const authenticateUser = async (headers) => {
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
const handler = async (event) => {
    // Basic error checking for environment variables
    if (!MONGODB_URI) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'MongoDB URI not configured' })
        };
    }
    try {
        // Authenticate the user
        let user;
        try {
            user = await authenticateUser(event.headers);
        }
        catch (authError) {
            console.error('Authentication error:', authError);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }
        // Connect to MongoDB
        const client = new mongodb_1.MongoClient(MONGODB_URI);
        await client.connect();
        const database = client.db('Gryyk-47');
        const strategicMatrixCollection = database.collection('strategic-matrix');
        // Handle different HTTP methods
        switch (event.httpMethod) {
            case 'GET': {
                // Fetch documents for the authenticated user
                const documents = await strategicMatrixCollection.find({
                    userId: user.userId
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
                newDocument.userId = user.userId;
                newDocument.lastUpdated = new Date();
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
                const updateResult = await strategicMatrixCollection.updateOne({ _id: new mongodb_1.ObjectId(documentId), userId: user.userId }, {
                    $set: {
                        ...updateData,
                        lastUpdated: new Date()
                    }
                });
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
                    _id: new mongodb_1.ObjectId(deleteId),
                    userId: user.userId
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
    }
    catch (error) {
        console.error('Server error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.handler = handler;
