const HTTP_PORT = 8000;

const path = require("path");
const exphbs = require("express-handlebars"); 
const bodyParser = require("body-parser")
const express = require("express");
const expSession = require("express-session");
const auth = require("./auth");
const music = require("./music-data");
const app = express();

app.set("views",path.join(__dirname,"views"));

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  layoutsDir: path.join(__dirname,"views/layouts")
}));

//seteo de handlebars
app.set("view engine", "handlebars");

// Middleware para rutas a recursos estáticos. 
app.use(express.static(path.join(__dirname, "public")));

//seteo de body-parser para Content-Type "json"
app.use(bodyParser.json());
// Body Parser para Content-Type "application/x-www-form-urlencoded"
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración del objeto de sesión
app.use(expSession({
  secret: "configdelobjetosession",
  resave: false,
  saveUninitialized: false
}));

//Vista landing - ruta raíz
app.get("/", (req, res) => {

  if (req.session.genresSection) {    
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

  res.render("landing");
});

app.get("/home", (req, res) => {
  
  // Si no eligió los géneros, lo redirijo a "/genres"
  if (req.session.genresSection) {
    res.redirect("/genres");
    return
  }
  
  if (req.session.logged) { // Falta función que vaya a buscar las canciones con el genero elegido del usuario
    res.render("home" , { user: req.session.logged });
  
    delete req.session.genresSection;
  }
});

app.get("/login", (req, res) => {
  res.render("login", { msg: req.session.logmessage });
});

app.get("/register", (req, res) => {
  res.render("register", { msg: req.session.regmessage });
});

//Muestra todos los géneros para que el usuario elija sus favoritos
app.get("/genres", (req ,res) => {
  
  //dato que uso por si el usuario no elige los géneros, y entra a "/home" o cierra y abre la página
  req.session.genresSection = true;

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

app.get("/explore", (req, res) => {
  res.send("Explora un poco");
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
  const userGenres = req.body;
  
  //recibo como parametro del callback (result) un boolean
  music.addUserGenres( req.session.logged.username, userGenres, result => {
    // Elimino esta propiedad si se pudo guardar en la db los géneros del user
    if (result) delete req.session.genresSection; 
     
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
          username: req.body.username
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


app.listen(HTTP_PORT, () => {
  console.log(`Server iniciado en http://localhost:${HTTP_PORT}`);
});