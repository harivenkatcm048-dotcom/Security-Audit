const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://nexentratechnologies_db_user:mgjq5yP7T8xcIxgO@nexentra.h7bzy6i.mongodb.net/nexentra?retryWrites=true&w=majority";

async function testConnection() {
  console.log("Connecting to MongoDB Atlas with nexentratechnologies_db_user...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("SUCCESSFULLY CONNECTED TO MONGODB ATLAS!");
    const db = client.db('nexentra');
    const cols = await db.listCollections().toArray();
    console.log("Collections in 'nexentra':", cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error("Connection error:", err.message);
  }
}

testConnection();
