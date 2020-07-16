const mongo = require("./db-const");

const login = (username, pass, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult({
        msg: "This operation couldn't be done, retry later please"
      });
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      //La búsqueda a la base de datos varía, dependiendo si se loguea con el mail o el username
      if (username.indexOf("@") < 0) {
        usersCollection.findOne({ "userdata.username": username, "userdata.password": pass }, (error, foundUser) => {

          if (error) {
            cbResult({
              msg: "We couldn't do the task, retry later please"
            });
          } else if (!foundUser) {
            cbResult({
              msg: "The information is not valid, try again"
            });
          } else {
            cbResult({
              user: {
                username: foundUser.userdata.username,
                avatarImg: foundUser.userdata.profile.pic,
                userGenres: foundUser.userdata.profile.genres
              }
            });
          }

          client.close();
        });

      } else {
        usersCollection.findOne({ "userdata.mail": user, "userdata.password": pass }, (error, foundUser) => {

          if (error) {
            cbResult({
              msg: "We couldn't do the task, retry later please"
            });
          } else if (!foundUser) {
            cbResult({
              msg: "The information is not valid, try again"
            });
          } else {
            cbResult({
              user: {
                username: foundUser.userdata.username,
                avatarImg: foundUser.userdata.profile.pic
              }
            });
          }

          client.close();
        });
      }
    }
  });
}

const getUser = (username, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult({ 
        success:false,
        msg: "This operation couldn't be done, retry later please"
      });
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.findOne({ "userdata.username": username }, (error, found) => {

        if (error) {
          cbResult({ 
            success:false,
            msg: "We couldn't do the task, retry later please"
          });
        } else {
          cbResult({ 
            success: true, 
            user: found, 
          });
        }

        client.close();
      });
    }
  });
}

const getUserByAlbum = (albumName, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult({ 
        success:false,
        msg: "This operation couldn't be done, retry later please"
      });
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.findOne({ useralbums: albumName}, (error, found) => {

        if (error) {
          cbResult({ 
            success:false,
            msg: "We couldn't do the task, retry later please"
          });
        } else {
          cbResult({ 
            success: true, 
            user: found, 
          });
        }

        client.close();
      });
    }
  });
}


const registerUser = (useremail, username, password, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult(false);
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      const newUser = {
        userdata: {
          username: username,
          password: password,
          mail: useremail,
          profile: {
            pic: "profile.png",
            bio: "",
            genres:[]
          }
        },
        usertracks:[],
        useralbums:[],
        interaction: {
          likes: [],
          followers: {
            amount: 0,
            users: []
          },
          following: {
            amount: 0,
            users: []
          }
        }
      }

      usersCollection.insertOne(newUser, (error, result) => {
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

const getUsersByFilter = (object, cbResult) => {
  mongo.mongoClient.connect(mongo.url, mongo.settings, (error, client) => {
    if (error) {
      cbResult({ 
        success:false,
        msg: "This operation couldn't be done, retry later please"
      });
    } else {
      const demusic = client.db("demusic");
      const usersCollection = demusic.collection("users");

      usersCollection.find(object).toArray((error, found) => {
        if (error) {
          cbResult({ 
            success:false,
            msg: "We couldn't do the task, retry later please"
          });
        } else {
          cbResult({ 
            success: true, 
            found, 
          });
        }

        client.close();
      });
    }
  });
}


module.exports = { login, getUser, registerUser, getUserByAlbum, getUsersByFilter };