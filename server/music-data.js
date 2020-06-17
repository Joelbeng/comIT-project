const mongo = require("./db-const");
const auth = require("./auth");

//Función que añade los géneros elegidos por el usuario a la base de datos.
//El tercer parametro es para chequear si se está registrando, o si ya es usuario loggeado
const addUserGenres = (username, userGenres, userStage, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error,client) => {
  
    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.updateOne({ "userdata.username":username }, {$set: { "userdata.profile.genres": userGenres }}, (error, result)=> {
        
        if (error){
          cbResult(false);
        } else if (userStage){
          cbResult(
            {
            success:true,
            user:"logged"
            }
            );
        } else {
          cbResult(
            {
            success:true,
            user:"registered"
            });
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

        client.close();
      });
    }
  });
}

//Función que busca en la db las canciones que coinciden con los géneros elegidos por el usuario
const getSongsByAlbum = (albumName, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.find({ "album.name": albumName }).toArray((error, songs) => {

        if (error) {
          cbResult({});
        } else {
          cbResult(songs);
        }

        client.close();
      });
    }
  });
}

//Función que busca en la colección music a partir de un filtro, especificándole el campo.
//params: campo, filtro, callback
const getSongsByFilter = (object, cbResult) => {
  
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    
    if (error) {
      cbResult({});
    } else {
      const demusic = client.db("demusic");
      const musicCollection = demusic.collection("music");

      musicCollection.find(object).toArray((error,songs)=>{

        if (error) {
          cbResult({});
        } else {
          cbResult(songs);
        }

        client.close();
      });
    }
  });
}
//Función que inserta documentos (canciones) en la colección music, con los datos que recibo cuando el usuario sube la canción
const insertAlbum = (username, songNames, songFileNames, genre, albumName, albumYear, songImg, cbResult) => {
  
  // creo el array de objetos a insertar
  let newAlbum = [];
  
  // itero la cantidad de canciones que el usuario subió y completo cada objeto con los datos correspondientes
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
        "file":`music/${songFileNames[i]}`,
        "img": `img/tracks/${songImg}`
      }  
    );
  }  

  //inserto en la db, dentro de la colección music todas las canciones nuevas
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

//Función que inserta un documento (canción) en la colección music
const insertSingle = (username, songName, songFileName, genre, songImg, cbResult) => {
  
  const newSingle = {
    "name": songName,
    "genre": genre,
    "artist": username,
    "file":`music/${songFileName}`,
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
          cbResult(error);
        } else {
          cbResult(true);
        }

        client.close();
      });
    }
  });

}

//función que actualiza los tracks que hay en el campo usertrack, dentro de la colección users en la db
const insertSongsInUserCol = (username, songFileNames, albumName, cbResult) => {
  
  auth.getUser(username, result =>{
    if (result.user) { 
      
      //almaceno los tracks del usuario encontrado
      const userCurrentSongs = result.user.usertracks;

      //agrego al array de los tracks actuales, los nuevos tracks subidos
      for (let i = 0; i = songFileNames.length; i++) {
        userCurrentSongs.push(songFileNames.shift());
      }

      mongo.mongoClient.connect(mongo.url, mongo.settings, (error,client) => {
  
        if (error) {
          cbResult(false);
        } else {
          const demusic = client.db("demusic");
          const usersCollection = demusic.collection("users");
    
          usersCollection.update({ "userdata.username":username }, {$set: { usertracks: userCurrentSongs }}, (error, result)=> {
            
            if (error) {
              cbResult(false);
            } else {
              cbResult(true);
            }
    
            client.close();
          });
        }
      });
    } else {
      cbResult(false);
    }
  });
}

//función que inserta el nombre del album en la colección users
const insertAlbuminUserCol = (username, albumName, cbResult) => {
  auth.getUser(username, result => {
    if (result.user) { 
      const userCurrentAlbums = result.user.useralbums;
      userCurrentAlbums.push(albumName);

      mongo.mongoClient.connect(mongo.url, mongo.settings, (error,client) => {

      if (error) {
        cbResult(false);
      } else {
        const demusic = client.db("demusic");
        const usersCollection = demusic.collection("users");

        usersCollection.update({ "userdata.username":username }, {$set: { useralbums:userCurrentAlbums }}, (error, result)=> {
          
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
  });
}    


module.exports = { getAllGenres, addUserGenres, getSongsByGenre, getSongsByAlbum, getSongsByFilter, insertAlbum, insertSingle, insertSongsInUserCol, insertAlbuminUserCol }