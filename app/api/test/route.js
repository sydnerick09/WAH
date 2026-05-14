import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;

    // Your database name
    const db = client.db('miriam');

    // Test database connection
    await db.command({ ping: 1 });

    return Response.json({
      success: true,
      message: 'MongoDB connected successfully',
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}