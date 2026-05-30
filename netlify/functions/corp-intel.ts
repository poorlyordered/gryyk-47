import { Handler } from '@netlify/functions';
import { MongoClient, ObjectId } from 'mongodb';
import { authenticateEveUser } from './auth-middleware';

declare const process: {
  env: {
    MONGODB_URI?: string;
  }
};

interface CorpIntelDocument {
  _id?: ObjectId;
  userId: string;
  title: string;
  content: string;
  category: 'alliances' | 'corporations' | 'characters' | 'locations';
  importance: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export const handler: Handler = async (event) => {
  if (!process.env.MONGODB_URI) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing MongoDB configuration' })
    };
  }

  try {
    const authResult = await authenticateEveUser(event.headers);
    const characterId = authResult.user.characterId.toString();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const collection = client.db('Gryyk-47').collection<CorpIntelDocument>('corp-intel');

    // Handle HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        const docs = await collection.find({ userId: characterId }).toArray();
        await client.close();
        return {
          statusCode: 200,
          body: JSON.stringify(docs)
        };
      }

      case 'POST': {
        const payload = JSON.parse(event.body || '{}');
        const newDoc: CorpIntelDocument = {
          userId: characterId,
          title: payload.title || '',
          content: payload.content || '',
          category: payload.category || 'corporations',
          importance: payload.importance || 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: payload.tags || []
        };

        if (!newDoc.title) {
          await client.close();
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
          _id: new ObjectId(docId),
          userId: characterId
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
  } catch (err) {
    console.error('Corp Intel API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
