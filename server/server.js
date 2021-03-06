const HTTP_PORT = 8000;

// Paquetes npm 
const path = require("path");
const bodyParser = require("body-parser")
const multer = require("multer");
const exphbs = require("express-handlebars"); 
const expSession = require("express-session");
const express = require("express");

// Modulos propios importados
const auth = require("./auth");
const music = require("./music-data");
const profile = require("./profile");

const app = express();
 
// Configuración de Handlebars
app.set("views",path.join(__dirname,"views"));

app.engine("handlebars", exphbs({
  defaultLayout: "app",
  layoutsDir: path.join(__dirname,"views/layouts")
}));

app.set("view engine", "handlebars");

//--------------------------------------------------------
// Configuración de Multer
const uploadStorage = multer.diskStorage({
  
  destination: (req, file, setFolderCallback) => {

    if (file.fieldname == "newSong") {     
      setFolderCallback(null, './server/public/music');

    } else if (file.fieldname == "songImg") {
      setFolderCallback(null, './server/public/img/tracks');
    
    } else {
      setFolderCallback(null, './server/public/img/profile');
    } 

},
  
  filename: (req, file, setFilenameCallback) => {
    if (file.fieldname == "newSong" || file.fieldname == "songImg") {
      setFilenameCallback(null, req.session.logged.username.toUpperCase()+"_"+file.originalname);
    } else {
      setFilenameCallback(null, req.session.logged.username.toUpperCase() +path.extname(file.originalname));
    }
  }  
});

// Se crea el middleware con ese storage.
const upload = multer({ storage: uploadStorage });
//------------------------------------------------------------

// Middleware para rutas a recursos estáticos. 
app.use(express.static(path.join(__dirname, "public")));

// Body-parser para Content-Type "json"
app.use(bodyParser.json());
// Body Parser para Content-Type "application/x-www-form-urlencoded"(<forms>)
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración del objeto de sesión
app.use(expSession({
  secret: "configdelobjetosession",
  resave: false,
  saveUninitialized: false
}));


// Rutas

// Página landing
app.get("/", (req, res) => {

  if (req.session.logged) {
    res.redirect("/home");
    if (currentSong) { 
      currentSong.state = "paused"; // se evita autoplay
      currentSong.actualTime = 0;
    }
    return
  }

  res.render("landing", { layout:"index" });
  req.session.destroy();
  currentSong = null; // se elimina la canción cargada en el reproductor
});

// Página principal, home
app.get("/home", (req, res) => {

  if (req.session.logged) { 
    const userGenres = req.session.logged.userGenres;

    if (userGenres.length > 0) {
      
      music.getSongsByGenre(userGenres, result => {
        if (result) {
          res.render("home", 
          { 
            user: req.session.logged, 
            songs: result,
            title:"musicForYou",
            homeActive: "active-view",
            player: true
          }); 
        } else {
          res.redirect("/error");
        }
      });

    } else {
      music.getSongsByFilter({}, result => {
        if (result) {
          res.redirect("/home-all-songs");
        } else {
          res.redirect("/error")
        }
      });
    }

  } else { 
    music.getSongsByFilter({}, result => {
      if (result) {
        res.render("home", { 
          songs: result,
          homeActive: "active-view",
          player:true 
        });
      } else {
        res.redirect("/error")
      }
    });
  }

});

app.get("/home-all-songs",(req, res) => {
  music.getSongsByFilter({}, result => {
    if (result) {
      res.render("home", 
      { 
        user: req.session.logged,
        songs: result,
        title:"allSongs",
        homeActive: "active-view",
        player: true 
      });
    } else {
      res.redirect("/error");
    }
  });
});

// Página de Login
app.get("/login", (req, res) => {
  res.render("login", { layout:"index", msg: req.session.authMessage });
  if (req.session.authMessage) delete req.session.authMessage;
  currentSong = null;
});

// Página de Registro
app.get("/register", (req, res) => {
  res.render("register", { layout:"index", msg: req.session.authMessage });
  if (req.session.authMessage) delete req.session.authMessage;
  currentSong = null;
});

// Página de elección de géneros
app.get("/genres", (req ,res) => {
  
  music.getAllGenres(genres => {
    if (genres) {
      res.render("genres", {
        user:req.session.logged,
        genres,
        player:false
      });
    } else {
      res.redirect("/error");
    }
  });

});

// Página para subir canciones
app.get("/upload", (req, res) => {

  music.getAllGenres(genres => {
    if (genres) {
      res.render("upload", {
        user: req.session.logged,
        genres,
        uploadActive:"active-view",
        player:true
      });
    } else {
      res.redirect("/error");
    }
  });

});

// Página de perfil de usuario
app.get("/userProfile", (req, res) => {
  let uploadMsg; // va a contener un objeto que detalla en el front el estado de lo subido recientemente

  if (req.session.logged.uploadAlert) {
    uploadMsg = req.session.logged.uploadAlert;
    delete req.session.logged.uploadAlert;
  }

  auth.getUser(req.session.logged.username, result => {   
    if (!result.success) {
      res.redirect("/error");
      return;
    }

    music.getSongsByFilter({ artist: req.session.logged.username }, songs => {
      if (songs) {
        let userAlbums = [];
        
        if (result.user.useralbums.length > 0) {   
          const filteredSongs = songs.filter(song => song.album); // se filtran canciones que tienen la propiedad album

          result.user.useralbums.forEach(album => {         
            userAlbums.push(filteredSongs.find(song => song.album.name === album)); // por cada album del usuario, se busca una canción que tenga el mismo nombre de album
          });
 
          userAlbums = userAlbums.map(finalAlbum => ({
              name: finalAlbum.album.name,
              year: finalAlbum.album.year,
              img: finalAlbum.album.img              
          }));              
        }

        res.render("userProfile", {
          user:req.session.logged,
          songs,
          albums:userAlbums,
          userBio:result.user.userdata.profile.bio,
          uploadMsg,
          player:true
        });

        // se elimina el valor de la var para que no aparezca siempre el detalle de lo subido
        uploadMsg = null; 
      } else {
        res.redirect("/error");
      }
    });
  });

});

// Página para añadir foto y bio al perfil del usuario 
app.get("/setProfile", (req, res) => {
  res.render("setProfile", 
    { 
      user:req.session.logged,
      player:false 
    });
});

// Perfil del artista seleccionado 
app.get("/artist/:artist", (req, res) => {

  // Si se hace click sobre mi propio nombre de artista (username) en la canción, se redirige al perfil del usuario
  if (req.session.logged) {
    if (req.params.artist === req.session.logged.username) {
      res.redirect("/userProfile");
      return;
    }
  }

  // Se busca al usuario clickeado para obtener su bio y su foto. Luego obtenemos sus canciones con la segunda función
  auth.getUser(req.params.artist, result => {
    if (!result.success) {
      res.redirect("/error");
      return;
    }

    music.getSongsByFilter({ artist: req.params.artist }, songs => {
      if (songs) {
        let userAlbums = [];
      
        if (result.user.useralbums.length > 0) {   
          const filteredSongs = songs.filter(song => song.album); // se filtran canciones que tienen la propiedad album

          result.user.useralbums.forEach(album => {         
            userAlbums.push(filteredSongs.find(song => song.album.name === album)); // por cada album del usuario, se busca una canción que tenga el mismo nombre de album
          });

          userAlbums = userAlbums.map(finalAlbum => ({
              name: finalAlbum.album.name,
              year: finalAlbum.album.year,
              img: finalAlbum.album.img              
          }));              
        }

        res.render("artist",
          { 
            songs,
            albums: userAlbums,
            artist:result.user.userdata,
            user:req.session.logged,
            player:true
          }
        );

        } else {
          res.redirect("/error");
        }
      });
    });
  
});

// Endpoint para desloguearse
app.get("/signOut", (req, res) => {
  req.session.destroy();
  currentSong = null;
  res.redirect("/");
});

// Página de error
app.get("/error", (req, res) => {
  res.render("error", { msg:"An error has occurred, please comeback later" });
});


// Endpoint que valida al user
app.post("/login", (req, res) => { 

  auth.login(req.body.username, req.body.password, result => {
    if (result.user) {  
      req.session.logged = result.user;
      res.redirect("home");
    } else {
      req.session.authMessage = {
        msg: result.msg
      }  

      res.redirect("/login");
    }
  });
});

// Post AJAX. Inserta en la base de datos los géneros elegidos por el usuario
app.post("/genres", (req, res) => {
  const userOldGenres = req.session.logged.userGenres; // var con géneros elegidos anteriormente, para saber si el user es nuevo o no
  req.session.logged.userGenres = req.body; // se almacenan los géneros elegidos por el user en la session

  // se recibe como parametro del callback (result) un boolean que es enviado al front
  music.addUserGenres(req.session.logged.username, req.body, result => {
    if (result) {
      res.json({ result, userOldGenres });
    } else {
      res.status(500);
    }
  });
});

// Post que para registrar al usuario
app.post("/register",(req, res) => {
  
  // se valida que el user haya completado los campos
  if (!req.body.email || !req.body.username || !req.body.pass) {
    req.session.authMessage = {
      msg: "Complete all the fields please"
    } 
    res.redirect("/register");
    return;
  } 
  
  // se chequea que las contraseñas sean iguales
  if (req.body.pass !== req.body.passrepeat) {
    req.session.authMessage = {
      msg: "The passwords must be equal, try it again"
    } 
    res.redirect("/register");
    return;
  }
  
  // se chequea que no haya usuario con el mismo username
  auth.getUser(req.body.username, result => {

    if (!result.success) {
      req.session.authMessage = { msg: result.msg }
      res.redirect("/register");
      return;
    }

    if (result.user) {
      req.session.authMessage = {
        msg: "This username is alredy in use. Choose another one please"
      }
      res.redirect("/register");
      return;
    }
    
    // se registra al usuario 
    auth.registerUser(req.body.email, req.body.username, req.body.pass, result => {
  
      if (result) {
        req.session.logged = {
          username: req.body.username,
          avatarImg:"profile.png",
          userGenres:[]
        }     
        res.redirect("/genres"); 

      } else {
        req.session.authMessage = {
          msg:"This operation couldn't be done, retry later please"
        }  
        res.redirect("/register");
      }

    });
  });
});

// POST que recibe las canciones y la imagen subidas por el usuario
app.post("/upload", upload.fields([{ name:"newSong" }, { name:"songImg" }]), (req, res) => {
  let songsFileNames =[];

  // Se guardan los filenames de las canciones subidas por el usuario en un array
  for (let i = 0; i < req.files.newSong.length; i++) {
    songsFileNames.push(req.files.newSong[i].filename);
  }

  // Si hay más de una canción en el array se inserta en la db como album, si no se inserta como single
  if (songsFileNames.length > 1) {

    music.insertAlbum(req.session.logged.username, req.body.songname, songsFileNames, req.body.songGenre,req.body.albumName, req.body.albumYear, req.files.songImg, result => {
      if (result) {
        music.insertSongsInUserCol(req.session.logged.username, songsFileNames, req.body.albumName, result => {
          if (result) {
            req.session.logged.uploadAlert = { 
              msg: "Your new album has been uploaded successfully",
              id: "successUpload"
            }
            res.redirect("/userProfile");
          } else {
            req.session.logged.uploadAlert = { 
              msg: "Your album couldn´t be uploaded rigth now. Retry it later please",
              id: "failUpload"
            }
            res.redirect("/userProfile");
          }
        });
      } else {
        req.session.logged.uploadAlert = { 
          msg: "Your album couldn´t be uploaded rigth now. Retry it later please",
          id: "failUpload"
        }
        res.redirect("/userProfile");
      }
    });

  } else {

    music.insertSingle(req.session.logged.username, req.body.songname, songsFileNames, req.body.songGenre, req.files.songImg, result => {
      if (result) {        
        music.insertSongsInUserCol(req.session.logged.username, songsFileNames, null, result => {
          if (result) {
            req.session.logged.uploadAlert = {
              msg:"Your new song has been uploaded successfully",
              id:"successUpload"
            }
            res.redirect("/userProfile");
          } else{
            req.session.logged.uploadAlert = { 
              msg: "Your song couldn´t be uploaded rigth now. Retry it later please",
              id: "failUpload"
            }
            res.redirect("/userProfile");
          }
        });
      } else {
        req.session.logged.uploadAlert = { 
          msg: "Your album couldn´t be uploaded rigth now. Retry it later please",
          id: "failUpload"
        }
        res.redirect("/userProfile");
      }
    });
  }
});

// POST que recibe la descripción de la bio y la foto de perfil del usuario.
app.post("/setProfile", upload.single("profilePic"), (req, res) => {

  // Si el usuario sólo sube su bio y no la foto, se actualiza únicamente ese campo en la db, y se retorna.
  if (req.body.bio && !req.file) {
    profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.bio":req.body.bio }, result => {
      if (result) {
        res.redirect("/home");
      } else {
        res.redirect("/error");
      }
    });
    return
  }

  // Si el usuario sólo sube su foto y no la bio, se actualiza únicamente ese campo en la db y se retorna
  if (req.file.filename && !req.body.bio) {
    profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.pic":req.file.filename }, result => {
      if (result) {
        res.redirect("/home");
      } else {
        res.redirect("/error");
      }
    });
    return  
  } 
    
  // Si el usuario sube ambos datos, se actualizan ambos campos en la db
  profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.bio":req.body.bio }, result => {
    if (result) {
      profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.pic":req.file.filename }, result => {
        if (result) {
          //se pisa el avatarImg que tenía como default
          req.session.logged.avatarImg = req.file.filename;
          res.redirect("/home");
        } else {
          res.redirect("/error")   
        }
      });
    } else {
      res.redirect("/error");
    }
  });
  
}); 

// GET que lleva al album clickeado
app.get("/album/:album", (req,res) => {
  music.getSongsByFilter({ "album.name": req.params.album }, songs => {
    if (songs) {
      res.render("album",
        { 
          albumName:songs[0].album.name,
          albumYear:songs[0].album.year,
          albumCover:songs[0].img,
          albumGenres:songs[0].genre,
          artist:songs[0].artist,
          songs, 
          user:req.session.logged,
          player:true
        }
      );
    } else {
      res.redirect("/error");
    }
  });
});

// GET que realiza la consulta en la db según lo ingresado en la barra de búsqueda
app.get("/search/:all", (req, res) => {

  // se crea una regex que sea case insensitive y que busque el match al principio del string
  const param = new RegExp(`^${req.params.all}`,"i");

  let foundSongs = [];
  let foundAlbums = [];

  // Se buscan las canciones y los albums coincidentes con la regex
  music.getSongsByFilter({$or:[{ "name":{$regex:param} },{ "album.name":{$regex:param} }]}, tracks => {
    if (tracks) {

      // Se iteran las canciones encontradas, para discriminar si la regex coincide con el nombre de la canción o con el album. 
      tracks.forEach(track => {
        if (track.name.toUpperCase().indexOf(req.params.all.toUpperCase()) == 0) {
          foundSongs.push(track);
        } else if (track.album.name.toUpperCase().indexOf(req.params.all.toUpperCase()) == 0) {
            if (foundAlbums.every(foundAlbum => foundAlbum.album.name !== track.album.name)) { // se chequea que no se repitan albums
              foundAlbums.push(track);
            }
        }  
      });

      auth.getUsersByFilter({ "userdata.username":{$regex:param} }, users => {

        if (users.success) {
          const foundArtists = users.found;
          let searchResultMsg;

          if (foundSongs.length == 0 && foundAlbums.length == 0 && foundArtists.length == 0) {
            searchResultMsg = `There are no results for  "${req.params.all}"`;
          } else {
            searchResultMsg = `Results for "${req.params.all}"`;
          }

          res.render("home", 
          {
            user: req.session.logged, 
            foundSongs,
            foundArtists,
            foundAlbums,
            searchTitle:searchResultMsg,
            player:true
          });
        } 
      });   
    }
  });
}); 

// Contiene objeto con detalles de la canción reproduciéndose en el momento
let currentSong; 

// POST AJAX que recibe detalles de la canción reproduciéndose en el momento
app.post("/playerInfo", (req, res) => {
    currentSong = req.body;
    console.log(req.body);  
});

// GET AJAX que envía al front detalles de la canción actual
app.get("/playerInfo", (req, res) => {
  res.json(currentSong);
  currentSong = null;
});

app.listen(HTTP_PORT, () => {
  console.log(`Server iniciado en http://localhost:${HTTP_PORT}`);
});
