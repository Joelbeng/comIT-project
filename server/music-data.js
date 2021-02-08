const mongo = require("./db-const");
const auth = require("./auth");

//Función que añade los géneros elegidos por el usuario a la base de datos.
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

// Función que busca en la db las canciones que coinciden con los géneros elegidos por el usuario
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
          cbResult(songs.reverse()); // se hace reverse() para que estén primero las últimas canciones subidas
        }

        client.close();
      });
    }
  });
}

//Función que busca en la colección music a partir de un filtro, especificándole el campo.
const getSongsByFilter = (object, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.find(object).toArray((error,songs)=> {
        if (error) {
          cbResult({});
        } else {
          cbResult(songs.reverse());
        }

        client.close();
      });
    }
  });
}

// Función que inserta documentos (canciones) en la colección music, con los datos que recibo cuando el usuario sube la canción
const insertAlbum = (username, songNames, songFileNames, genre, albumName, albumYear, songImg, cbResult) => {
  
  // se chequea si el usuario subió alguna img para la canción o album. Si no lo hizo se le agrega una img default
  if (!songImg) {
    songImg = "song.png";
  } else {
    songImg = songImg[0].filename;
  }

  // se crea el array de objetos a insertar
  let newAlbum = [];
  
  // se itera la cantidad de canciones que el usuario subió, se completa cada objeto con los datos correspondientes
  for (let i = 0; i < songNames.length; i++) {
    newAlbum.push(
      {
        "name": songNames[i],
        "genre": genre,
        "artist": username,
        "album":
        {
          "name":albumName,
          "year":albumYear,
          "img":`img/tracks/${songImg}`
        },
        "file":`${songFileNames[i]}`,
        "img": `img/tracks/${songImg}`
      }  
    );
  }  

  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.insertMany(newAlbum, (error, result) => {

        if (error) {
          cbResult(false);
        } else {
          cbResult(true);
        }

        client.close();
      });
    }
  });
}

// Función que inserta un documento (canción) en la colección music
const insertSingle = (username, songName, songFileName, genre, songImg, cbResult) => {
  
  if (!songImg) {
    songImg = "song.png";
  } else {
    songImg = songImg[0].filename;
  }

  const newSingle = {
    "name": songName,
    "genre": genre,
    "artist": username,
    "file":`${songFileName}`,
    "img": `img/tracks/${songImg}`
  }  

  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.insertOne(newSingle, (error, result) => {
        if (error) {
          cbResult(false);
        } else {
          cbResult(true);
        }

        client.close();
      });
    }
  });
}

// Función que actualiza las canciones y albums dentro de la colección users en la db
const insertSongsInUserCol = (username, songFileNames, albumName, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error,client) => {

    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.updateOne({ "userdata.username":username },{$push: {usertracks :{$each:songFileNames} }} , (error, result)=> {
        
        if (error) {
          cbResult(false);
        } else if(albumName) {
          
          usersCollection.updateOne({ "userdata.username":username },{$push: {useralbums :albumName }} , (error, result)=> {
          if (error) {
            cbResult(false);
          } else {
            cbResult(true);
          }

          client.close();
        });

        } else {
          cbResult(true);
          client.close(); // se ubica acá para que no se cierre la conexión antes del update Album
        }
      });
    }
  });
}    

module.exports = { getAllGenres, addUserGenres, getSongsByGenre, getSongsByFilter, insertAlbum, insertSingle, insertSongsInUserCol }