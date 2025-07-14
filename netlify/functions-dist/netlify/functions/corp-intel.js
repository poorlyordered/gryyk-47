"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const mongodb_1 = require("mongodb");
const eve_1 = require("../../src/services/eve");
const handler = async (event) => {
    if (!process.env.MONGODB_URI) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing MongoDB configuration' })
        };
    }
    try {
        // Verify authentication
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        const token = authHeader.split(' ')[1];
        const character = await (0, eve_1.verifyToken)(token);
        if (!character) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Invalid token' }) };
        }
        const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const collection = client.db('Gryyk-47').collection('corp-intel');
        // Handle HTTP methods
        switch (event.httpMethod) {
            case 'GET': {
                const docs = await collection.find({ userId: character.characterId }).toArray();
                await client.close();
                return {
                    statusCode: 200,
                    body: JSON.stringify(docs)
                };
            }
            case 'POST': {
                const payload = JSON.parse(event.body || '{}');
                const newDoc = {
                    userId: character.characterId,
                    title: payload.title || '',
                    content: payload.content || '',
                    category: payload.category || 'corporations',
                    importance: payload.importance || 'medium',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: payload.tags || []
                };
                if (!newDoc.title) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Title is required' }) };
                }
                const result = await collection.insertOne(newDoc);
                await client.close();
                return {
                    statusCode: 201,
                    body: JSON.stringify({ id: result.insertedId, ...newDoc })
                };
            }
            case 'DELETE': {
                const docId = event.path.split('/').pop();
                if (!docId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Document ID required' }) };
                }
                const result = await collection.deleteOne({
                    _id: new mongodb_1.ObjectId(docId),
                    userId: character.characterId
                });
                await client.close();
                if (result.deletedCount === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: 'Document not found' }) };
                }
                return { statusCode: 200, body: JSON.stringify({ success: true }) };
            }
            default:
                return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
        }
    }
    catch (err) {
        console.error('Corp Intel API error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
exports.handler = handler;
