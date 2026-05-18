import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ Missing MONGODB_URI in .env.local");
}

// Global cache to prevent multiple connections in dev (HMR safe)
let client;
let clientPromise;

// Attach to global object (prevents reconnect on every reload)
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    maxPoolSize: 10, // better performance
    serverSelectionTimeoutMS: 5000, // fail fast if DB is down
  });

  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;