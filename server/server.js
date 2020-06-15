const HTTP_PORT = 8000;

//paquetes npm importados
const path = require("path");
const exphbs = require("express-handlebars"); 
const bodyParser = require("body-parser")
const expSession = require("express-session");
const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');


//modulos propios importados
const auth = require("./auth");
const music = require("./music-data");

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
    } else {
      setFolderCallback(null, './server/public/img/song');
  }

},
  
  filename: (req, file, setFilenameCallback) => {
    setFilenameCallback(null, req.body.songname + path.extname(file.originalname));
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
  if (req.session.genresView) {    
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
  
  if (req.session.logged && req.session.genresView) {
    res.redirect("/genres");
    return
  }
  
  if (req.session.logged) { 
    const userGenres = req.session.logged.userGenres;
    console.log(userGenres);
    music.getSongsByGenre(userGenres, result => {

      if (result) {
        res.render("home" , 
        { layout:"registered", 
          user: req.session.logged , 
          songs: result
        }); 
      } else {
        res.render("home");
      }
    });

  } else { //lo mando al home con otro layout
    res.redirect("/");
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
        genres: genres
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
        genres: genres
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
      console.log(req.session.logged);

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
  music.addUserGenres( req.session.logged.username, req.session.logged.userGenres , result => {
    // Elimino esta propiedad si se pudo guardar en la db los géneros del user
    if (result) delete req.session.genresView; 
     
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

app.post("/logout",(req, res) => {
  req.session.destroy();
});

//Post que recibe la canción subida por el usuario
app.post("/upload", upload.fields([{name:"newsong"},{name:"songimg"}]), (req, res) => {
  console.log(req.file);
  
  //El problema es que puedo subir una canción, pero no un album. Porque si subo más de una canción no tengo acceso al req.body.songname (name del input en donde el usuario ingresa el nombre de la canción), me lo retorna como undefined. También desde en el endpoint post donde recibo la data del submit no tengo acceso al req.file, me tira siempre undefined, suba una canción o más que una. Me volví loco tratando de acceder al req.song.name[i] haciendo un for, probando cosas pero nada. Como podría acceder a cada req.body.songname?
  
  //Si solo subo una canción puedo agregarle el id como quería en la base de datos, y también tener la referencia en el user de esa canción con el id, pero como la canción se me guarda en la carpeta con el req.body.songname(el nomre que le pone el usuario) cuando la base de datos va a buscar esa canción no la encuentra. Voy a tener que desistir de eso del id me parece y solo manejarme con el req.body.songname,aunque se que es superdebil porque se puede pisar muy rápido. La cosa es que no puedo subir albums, y así dejo afuera algo bastante crucial en una app de música.
});


app.listen(HTTP_PORT, () => {
  console.log(`Server iniciado en http://localhost:${HTTP_PORT}`);
});