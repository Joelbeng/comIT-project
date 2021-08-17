const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = "mongodb+srv://admin:admin@cluster0-4a4p0.mongodb.net/test";
const settings = { useUnifiedTopology: true };

module.exports = {
  mongoClient,
  url,
  settings,
}


