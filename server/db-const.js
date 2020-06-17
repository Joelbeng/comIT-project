const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017";
const settings = { useUnifiedTopology: true };

module.exports = {
  mongoClient,
  url,
  settings,
}


