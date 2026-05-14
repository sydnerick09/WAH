import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db();

    const collections = await db.listCollections().toArray();

    await client.close();

    return Response.json({
      success: true,
      message: 'MongoDB connected successfully',
      collections,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}