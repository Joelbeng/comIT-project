const HTTP_PORT = 8000;

//paquetes npm importados
const path = require("path");
const exphbs = require("express-handlebars"); 
const bodyParser = require("body-parser")
const expSession = require("express-session");
const express = require("express");
const multer = require("multer")

//modulos propios importados
const auth = require("./auth");
const music = require("./music-data");
const profile = require("./profile");

//pasar todos los req.session a un objeto para manejarlos más prolijos

const app = express();

//seteo de handlebars
app.set("views",path.join(__dirname,"views"));

app.engine("handlebars", exphbs({
  defaultLayout: "unregistered",
  layoutsDir: path.join(__dirname,"views/layouts")
}));

app.set("view engine", "handlebars");

// Configuración de almacenamiento de canción recibida, con Multer
const uploadStorage = multer.diskStorage({
  
  destination: (req, file, setFolderCallback) => {

    if (file.fieldname == "newsong") {     
      setFolderCallback(null, './server/public/music');

    } else if (file.fieldname == "songimg") {
      setFolderCallback(null, './server/public/img/tracks');
    
    } else {
      setFolderCallback(null, './server/public/img/profile');
    } 

},
  
  filename: (req, file, setFilenameCallback) => {
    if (file.fieldname == "newsong" || file.fieldname == "songimg") {
      setFilenameCallback(null, req.session.logged.username.toUpperCase()+"_"+file.originalname);
    } else {
      setFilenameCallback(null, req.session.logged.username.toUpperCase() +path.extname(file.originalname));
    }
  }  
});

// Se crea el middleware con ese storage.
const upload = multer({ storage: uploadStorage });

// Middleware para rutas a recursos estáticos. 
app.use(express.static(path.join(__dirname, "public")));

// Body-parser para Content-Type "json"
app.use(bodyParser.json());
// Body Parser para Content-Type "application/x-www-form-urlencoded"(<forms>)
app.use(bodyParser.urlencoded({ extended: true }));
// Body Parser para Content-Type "application/x-www-form-urlencoded"

// Configuración del objeto de sesión
app.use(expSession({
  secret: "configdelobjetosession",
  resave: false,
  saveUninitialized: false
}));

//Vista landing - ruta raíz
app.get("/", (req, res) => {

  //Si el usuario se estaba registrando y cierra el navegador, lo vuelvo a mandar a la misma instancia
  if (req.session.genresView && req.session.user == undefined) {    
    res.redirect("/genres");
    return;
  }
  
  if (req.session.logged) {
    res.redirect("/home");
    return
  } 

  // elimino los mensajes de error (login y register) al volver al home
  if (req.session.logmessage || req.session.regmessage) {
    delete req.session.logmessage;
    delete req.session.regmessage;
  }

  res.render("landing",{layout:"login"});
});

app.get("/home", (req, res) => {
  req.session.user = true; // parche para quedar enganchado en la vista genre

  if (req.session.logged && req.session.genresView && !req.session.user) {
    res.redirect("/genres");
    return
  }

  if (req.session.logged) { 
    const userGenres = req.session.logged.userGenres;

    music.getSongsByGenre(userGenres, result => {

      if (result) {
        res.render("home" , 
        { layout:"registered", 
          user: req.session.logged, 
          songs: result,
          player:true
        }); 
      } else {
        res.render("home");
      }
    });

  } else { //lo mando al home con otro layout
    res.redirect("/home",{ layout:"unregistered", player:true });
  }
});

app.get("/login", (req, res) => {
  res.render("login", {layout:"login", msg: req.session.logmessage });
});

app.get("/register", (req, res) => {
  res.render("register", {layout:"login", msg: req.session.regmessage });
});

//Muestra todos los géneros para que el usuario elija sus favoritos
app.get("/genres", (req ,res) => {
  
  //dato que uso por si el usuario no elige los géneros, y entra a "/home" o cierra y abre la página
  req.session.genresView = true;

  music.getAllGenres(genres => {
    if (genres) {
      res.render("genres", {
        layout:"registered",
        user:req.session.logged.username,
        genres: genres,
        player:false
      });
    } else {
      res.redirect("/error");
    }
  });

});

app.get("/upload", (req, res) => {
  
  //Ejecuto la función para muestrar en el front un select con todos los géneros
  music.getAllGenres(genres => {
    if (genres) {
      res.render("upload", {
        layout:"registered",
        user: req.session.logged,
        genres: genres,
        player:false
      });
    } else {
      res.redirect("/error");
    }
  });

})

app.get("/explore", (req, res) => {
  res.render("home");
});

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
        req.session.logmessage = {
          msg: result.msg
        }  

        res.redirect("/login");
    }
  });
});

//Post AJAX. Inserta en la base de datos los géneros elegidos por el usuario -- Usar este mismo endpoint para cambiar los géneros más adelante
app.post("/genres", (req, res) => {
  req.session.logged.userGenres = req.body;
  
  //recibo como parametro del callback (result) un boolean
  music.addUserGenres( req.session.logged.username, req.session.logged.userGenres , req.session.user, result => {
    // Elimino esta propiedad si se pudo guardar en la db los géneros del user
    if (result.sucess) delete req.session.genresView; 
     
    res.send(result);
  });
});

//Post a register 
app.post("/register",(req, res) => {

  //Valido que haya completado los campos
  if (!req.body.email || !req.body.username || !req.body.pass) {
    req.session.regmessage = {
      msg: "Complete all the fields please"
    } 

    res.redirect("/register");
    return;
  } 
  
  if (req.body.pass !== req.body.passrepeat) {
    req.session.regmessage = {
      msg: "The passwords must be equal, try it again"
    } 

    res.redirect("/register");
    return;
  }
  
  //chequeo que no haya usuario con el mismo username
  auth.getUser(req.body.username, result => {

    if (!result.success) {
      req.session.regmessage = {
        msg: result.msg
      }

      res.redirect("/register");
      return;
    }

    if (result.user) {
      req.session.regmessage = {
        msg: "This username is alredy in use. Choose another one please"
      }

      res.redirect("/register");
      return;
    }
    
    // Registro al usuario 
    auth.registerUser(req.body.email, req.body.username, req.body.pass, result => {
  
      if (result) {
        req.session.logged = {
          username: req.body.username,
          avatarImg:"profile.png",
          userGenres:[]
        }     
        res.redirect("/genres"); 

      } else {
        req.session.regmessage = {
          msg:"This operation couldn't be done, retry later please"
        }  
        res.redirect("/register");

      } 
    });
  });
});

app.get("/signOut", (req, res) => {
  res.render("landing", {layout:"login"});
  req.session.destroy();
});

//Post que recibe la canción subida por el usuario
app.post("/upload", upload.fields([{name:"newsong"},{name:"songimg"}]), (req, res) => {

  //Chequeo si subió alguna img el usuario para la canción o album  
  if (req.files.songimg) {
    songimg = req.files.songimg[0].filename;
   } else {
    songimg = "song.png";
   }
  
  let songsFileNames =[];

  //guardo los filenames de las canciones subidas por el user en un array
  for (let i = 0; i < req.files.newsong.length; i++) {
    songsFileNames.push(req.files.newsong[i].filename);
  }

  //Si hay más de una canción inserto un album, si no inserto single
  if (songsFileNames.length > 1) {
  
    //inserto documentos con la info de cada canción en la colección music.Recibo boolean 
    music.insertAlbum(req.session.logged.username, req.body.songname, songsFileNames, req.body.songGenre,req.body.albumname, req.body.albumyear, songimg, result => {
      if (result) {
        // si recibo true en el callback, inserto el la colección users, el filename de cada canción para tener referencia
        music.insertSongsInUserCol(req.session.logged.username, songsFileNames,req.body.albumname, result => {
          if (result) {
            music.insertAlbuminUserCol(req.session.logged.username, req.body.albumname, result => {
              if (result) {
                console.log("Your song has been uploaded");
                res.redirect("/userProfile")
              } else {
                //llevarlo a error, setTime out que no se pudo y al home    
              }
            });
          
            //setTime interval que le diga que se subieron las canciones, y mandarlo a su perfil
          } else {
            //llevarlo a error, setTime out que no se pudo y al home
          }
        });
      } else {
        //llevarlo a error, setTime out que no se pudo y al home
      }
    });

  } else {

    music.insertSingle(req.session.logged.username, req.body.songname, songsFileNames, req.body.songGenre, songimg, result => {
      if (result) {
        
        music.insertSongsInUserCol(req.session.logged.username, songsFileNames, result => {
          if (result) {
            console.log("Your song has been uploaded")
            //setTime interval que le diga que se subieron las canciones, y mandarlo a su perfil
          } else{
            //llevarlo a error, setTime out que no se pudo y al home
          }
        });
      } else {
        //llevarlo a error, setTime out que no se pudo y al home
      }
    });
  }
});

app.get("/userProfile", (req, res) => {

  auth.getUser(req.session.logged.username, result => {
    
    if (!result.success) {
      res.redirect("/error");
      return;
    }
  
    music.getSongsByFilter({artist: req.session.logged.username}, songs => {
      if (songs) {
        res.render("userProfile",{
          layout:"registered",
          user:req.session.logged,
          songs,
          bio:result.user.userdata.profile,
          player:true
        }); 
      }
    });
  })
});

app.get("/setProfile", (req, res) => {
  res.render("setProfile", 
    { 
      layout:"registered",
      user:req.session.logged.username, 
      player:false 
    });
});

app.post("/setProfile",upload.single("profilePic"), (req, res) => {
  
  profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.bio":req.body.bio }, result => {
    if (result) {
      profile.updateProfile({ "userdata.username":req.session.logged.username }, { "userdata.profile.pic":req.file.filename }, result => {
        if (result) {
          //piso el avatarImg que tenía como default
          req.session.logged.avatarImg = req.file.filename;
          res.redirect("/home");
        } else {
          ////lo mando al home pero le digo que hubo un error
        }
      });
    } else {
      //lo mando al home pero le digo que hubo un error
    }
  });

}); 

app.get("/profile/:artist", (req, res) => {
                            
  if (req.params.artist === req.session.logged.username) {
    res.redirect("/userProfile");
    return;
  }

  auth.getUser(req.params.artist, user => {
    if (user) {
      music.getSongsByFilter({ artist: req.params.artist }, songs => {
        if (songs) {
          res.render("artist",
            { 
              layout:"registered", 
              songs, 
              player:true, 
              user,
              username:req.session.logged
            }
          );
        } else {
          res.redirect("/error");
        }
      });
    } else {
      res.redirect("/error");
    }
  });
  
});

app.get("/album/:album", (req,res) => {
console.log(req.params.album);
  auth.getUserByAlbum(req.session.logged.username, req.params.album, user => {
    
    if (user) {
      music.getSongsByAlbum(req.params.album, songs => {
        if (songs) {
          console.log(user);
          res.render("album",
            { 
              layout:"registered", 
              albumName:songs[0].album.name,
              albumYear:songs[0].album.year,
              albumCover:songs[0].img,
              songs, 
              player:true, 
              user:req.session.logged,
              artist:user
            }
          );
        } else {
          res.redirect("/error");
        }
      });
    } else {
      res.redirect("/error");
    }
  });
});



app.listen(HTTP_PORT, () => {
  console.log(`Server iniciado en http://localhost:${HTTP_PORT}`);
});