const mongo = require("./db-const");

const updateProfile = (comparator, updateContent, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");
      
      usersCollection.updateOne(comparator, { $set: updateContent}, (errror, result) => {

        if (error) {
          cbResult(false);
        } else {
          cbResult(true)
        }

        client.close();
      });
    }
  });
}

module.exports = { updateProfile };