const mongo = require("./db-const");

//Función que busca todos géneros de la página para renderizarlos en el front 
const getAllGenres = cbResult => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const allGenresCollection = demusic.collection("allGenres")

      allGenresCollection.findOne({}, (error, genres) => {
        if(error){
          cbResult({});
        } else {
          cbResult(genres.genres);
        }

        client.close();
      });
    }
  });
}

//Función que añade los géneros elegidos por el usuario a la base de datos
const addUserGenres = (username, userGenres, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error,client) => {
  
    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.updateOne({ "userdata.username":username }, {$set: { "userdata.profile.genres": userGenres }}, (error, result)=> {
        if (error){
          cbResult(false);
        } else {
          cbResult(true);
        }

        client.close();
      });
    }
  });
}

//Función que busca en la db las canciones que coinciden con los géneros elegidos por el usuario
const getSongsByGenre = (userGenres, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.find({ genre: { $in: userGenres } }).toArray((error, songs) => {

        if (error) {
          cbResult({});
        } else {
          cbResult(songs);
        }
      });
    }
  });
}

module.exports = { getAllGenres, addUserGenres, getSongsByGenre }
