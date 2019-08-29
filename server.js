// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const bodyParser = require("body-parser");
const sass = require("node-sass-middleware");
const app = express();
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const opencage = require('opencage-api-client');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// PG database client/connection setup
const { Pool } = require('pg');
const dbParams = require('./lib/db.js');
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// // Separated Routes for each Resource
// const mapsRoutes = require("./routes/maps");

// api routes
const usersRoutesAPI = require("./routes/usersAPI");
const mapsRoutesAPI = require("./routes/mapsAPI");

// Mount all resource routes
app.get("/maps/create", (req, res) => {
  templateVars = {
    user: req.session.userEmail
  }
  res.render("map_create", templateVars);
})

app.get("/maps/:id", (req, res) => {
  templateVars = {
    id: req.params.id,
    user: req.session.userEmail,
    userid: req.session.id
  }
  res.render("maps_show", templateVars);
});


const getUserById = function (id) {
  return db.query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then(data => {
      if (data.rows[0]) {
        return data.rows[0];
      } else {
        return null;
      }
    })
}

const getFavoriteMapsByUserId = function (id) {
  return db.query(`
    SELECT * FROM maps
    JOIN markers ON maps.id = markers.map_id
    WHERE markers.user_id = $1`, [id])
    .then(data => {
      return data.rows;
    })
}

const getAllMapsContributedToByUserId = function (id) {
  return db.query(`
   SELECT DISTINCT maps.id, maps.title, maps.city
   FROM maps
   JOIN markers ON maps.id = markers.map_id
   WHERE markers.user_id = $1;`, [id])
    .then(data => {
      if (data.rows) {
        return data.rows;
      } else {
        return null;
      }

    })
}


app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  getUserById(id)
    .then(user => {
      if (!user) {
        res.redirect("/");
      } else {
        const userInfo = user;

        getFavoriteMapsByUserId(id)
          .then(favMaps => {
            const favoriteMaps = favMaps;
            getAllMapsContributedToByUserId(id)
              .then(contMaps => {
                const contributedMaps = contMaps;

                templateVars = {

                  user: userInfo.email,
                  userid: req.session.id,
                  favmaps: favoriteMaps,
                  contmaps: contributedMaps
                }

                res.render("user-profile", templateVars);
              })
          })
      }
    })
})

app.get("/mymaps", (req, res) => {
  const id = req.session.id;
  db.query(`SELECT * FROM maps WHERE user_id = $1;`, [id])
    .then(data => {
      maps = data.rows;
      db.query(`SELECT * FROM markers;`)
        .then(data => {
          const markers = data.rows;

          for (let map of maps) {
            map.markers = [];
            for (let marker of markers) {
              if (marker.map_id === map.id) {
                map.markers.push(marker);
              }
            }

          }

          templateVars = {
            maps: maps,
            user: req.session.userEmail
          }

          res.render("mymaps", templateVars);
        })
    })


})


const getFavoriteByMapID = function (mapid, userid) {

  return db.query(`SELECT * FROM favorites WHERE map_id = $1 AND user_id=$2;`, [mapid, userid])
    .then(data => {
      if (data.rows) {
        console.log(data.rows)
        return data.rows[0];
      } else {
        return null;
      }
    })
}

app.post("/favorite", (req, res) => {
  const mapID = req.body.mapid;
  const userID = req.session.id;

  getFavoriteByMapID(mapID, userID)
    .then(fav => {

      if (!fav) {
        db.query(`INSERT INTO favorites (map_id, user_id) VALUES ($1, $2) RETURNING *;`, [mapID, userID])
          .then(data => {
            res.send('Added to favorites!')
          }).catch(error => {
            console.log(error)
          })
      } else {
        res.send("Already Favorited!");
      }
    })
})

app.post("/favorites/:id", (req, res) => {
  const id = req.params.id;

  db.query(`
   DELETE FROM favorites
   WHERE id = $1;`,
    [id])
    .then(data => {
      res.redirect("/favorites")
    })

});

app.get("/favorites", (req, res) => {

  const id = req.session.id;
  db.query(`
  SELECT maps.id, maps.lat, maps.long, maps.city, maps.title, maps.img, maps.user_id, favorites.id AS fav_id
  FROM maps
  JOIN favorites ON maps.id = favorites.map_id
  WHERE favorites.user_id = $1;`,
    [id])
    .then(data => {
      maps = data.rows;
      db.query(`SELECT * FROM markers;`)
        .then(data => {
          const markers = data.rows;

          for (let map of maps) {
            map.markers = [];
            for (let marker of markers) {
              if (marker.map_id === map.id) {
                map.markers.push(marker);
              }
            }
          }

          templateVars = {
            maps: maps,
            user: req.session.userEmail
          }
          res.render("favorites", templateVars);
        })
    })

})

app.get("/maps", (req, res) => {
  db.query(`SELECT * FROM maps;`)
    .then(data => {
      maps = data.rows;
      db.query(`SELECT * FROM markers;`)
        .then(data => {
          const markers = data.rows;

          for (let map of maps) {
            map.markers = [];
            for (let marker of markers) {
              if (marker.map_id === map.id) {
                map.markers.push(marker);
              }
            }

          }

          templateVars = {
            maps: maps,
            user: req.session.userEmail,
            userid: req.session.id
          }
          res.render("maps", templateVars);
        })
    })

});


app.use("/api/maps", mapsRoutesAPI(db));
app.use("/api/users", usersRoutesAPI(db));


// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).

app.get("/login", (req, res) => {
  templateVars = {
    user: req.session.userEmail
  }
  res.render("login", templateVars)
});

const getUserInfo = function (email) {
  return db.query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then(data => {
      if (data.rows) {
        return data.rows[0]
      } else {
        return null;
      }
    })
};

const checkPassword = function (email, password) {
  return (getUserInfo(email))
    .then(user => {

      if (user !== null) {
        if (bcrypt.compareSync(password, user.password)) {
          return user
        }
      } else {
        return null;
      }
    })
    .catch(error => console.log(error));
};

const createNewUser = function (email, password) {
  return db.query(`INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *;`, [email, password])
    .then(data => {
      if (data.rows[0]) {
        return data.rows[0];
      } else {
        return null;
      }
    }).catch(error => {
      console.log(error)
    })
};

app.get("/register", (req, res) => {
  templateVars = {
    user: req.session.userEmail
  }
  res.render("register", templateVars)
})

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPass = bcrypt.hashSync(password, 10);
  getUserInfo(email)
    .then(userInfo => {
      if (userInfo) {
        return res.status(400).send('email address has already been registered');
      } else {
        createNewUser(email, hashedPass)
          .then(user => {
            req.session.userEmail = user.email;
            req.session.id = user.id;
            res.redirect("/")

          })

      }
    })
})

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  checkPassword(email, password)
    .then(user => {
      if (!user) {
        res.redirect("/");
        return;
      }
      else {
        req.session.id = user.id;
        req.session.userEmail = user.email;
        res.redirect("/")
      }
    })
    .catch(error => res.send("hello"));
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
})


app.get("/", (req, res) => {
  db.query(`SELECT * FROM maps LIMIT 10;`)
    .then(data => {
      maps = data.rows;
      db.query(`SELECT * FROM markers;`)
        .then(data => {
          const markers = data.rows;

          for (let map of maps) {
            map.markers = [];
            for (let marker of markers) {
              if (marker.map_id === map.id) {
                map.markers.push(marker);
              }
            }
          }

          templateVars = {
            maps: maps,
            user: req.session.userEmail,
            userid: req.session.id
          }
          res.render("index", templateVars);
        })
    })
});


app.post("/maps/create", (req, res) => {
  const title = req.body.title;
  const city = req.body.city;
  const img = req.body.img;
  const user_id = req.session.id;
  opencage.geocode({ q: city }, '6d4de6cf56fc4852bef89f1d413e2b29').then(data => {
    // console.log(JSON.stringify(data));
    if (data.status.code == 200) {
      if (data.results.length > 0) {
        var place = data.results[0];


        const lat = place.geometry.lat;
        const long = place.geometry.lng;

        db.query(`INSERT INTO maps (lat, long, city, title, img, user_id)
        VALUES (${lat}, ${long}, '${city}', '${title}', '${img}', ${user_id})
        RETURNING *;`)
          .then(data => {
            const id = data.rows[0].id;
            const redirectUrl = "/maps/" + id;
            res.redirect(redirectUrl);
          })

      }
    } else if (data.status.code == 402) {
      console.log('hit free-trial daily limit');
      console.log('become a customer: https://opencagedata.com/pricing');
    } else {
      // other possible response codes:
      // https://opencagedata.com/api#codes
      console.log('error', data.status.message);
    }
  })
    .catch(error => {
      console.log('error', error.message);
    })


})


app.post("/maps/:id", (req, res) => {

    const map_id = req.params.id;
    const title = req.body.title;
    const description = req.body.description;
    const img = req.body.img;
    const address = req.body.address;
    const userid = req.body.userid;



    console.log(req.body.lat)
    console.log(req.body.long)

  if(req.body.lat && req.body.long){
    let latlong = `${req.body.lat}, ${req.body.long}`;
    console.log(latlong)



    opencage.geocode({ q: latlong }, '6d4de6cf56fc4852bef89f1d413e2b29').then(data => {
      // console.log(JSON.stringify(data));
      if (data.status.code == 200) {
        if (data.results.length > 0) {
          var place = data.results[0];
          console.log("IM IN HERE2", place)
          const address = place.formatted;
          const lat = place.geometry.lat;
          const long = place.geometry.lng;
          console.log(address);
          //console.log("lat", lat)
         // console.log("long", long)
          db.query(`INSERT INTO markers (lat, long, title, description, img, address, map_id, user_id)
         VALUES (${lat}, ${long}, '${title}', '${description}', '${img}', '${address}', ${map_id}, ${userid})
         RETURNING *;`)
            .then(data => {

              const redirectUrl = "/maps/" + map_id;
              res.redirect(redirectUrl);
            })

        }else{
          console.log("query empty")
          res.redirect("/")
        }
      } else if (data.status.code == 402) {
        console.log('hit free-trial daily limit');
        console.log('become a customer: https://opencagedata.com/pricing');

      } else {
        // other possible response codes:
        // https://opencagedata.com/api#codes
        console.log('error', data.status.message);
        res.redirect("/")
      }
    })
      .catch(error => {
        console.log('error', error.message);
        res.redirect("/")
      })

  }else{




    opencage.geocode({ q: address }, '6d4de6cf56fc4852bef89f1d413e2b29').then(data => {
      // console.log(JSON.stringify(data));
      if (data.status.code == 200) {
        if (data.results.length > 0) {
          var place = data.results[0];
          console.log("IM IN HERE1", place)
          const lat = place.geometry.lat;
          const long = place.geometry.lng;
          //console.log("lat", lat)
         // console.log("long", long)
          db.query(`INSERT INTO markers (lat, long, title, description, img, address, map_id, user_id)
         VALUES (${lat}, ${long}, '${title}', '${description}', '${img}', '${address}', ${map_id}, ${userid})
         RETURNING *;`)
            .then(data => {

              const redirectUrl = "/maps/" + map_id;
              res.redirect(redirectUrl);
            })

        }else{
          console.log("query empty")
          res.redirect("/")
        }
      } else if (data.status.code == 402) {
        console.log('hit free-trial daily limit');
        console.log('become a customer: https://opencagedata.com/pricing');

      } else {
        // other possible response codes:
        // https://opencagedata.com/api#codes
        console.log('error', data.status.message);
        res.redirect("/")
      }
    })
      .catch(error => {
        console.log('error', error.message);
        res.redirect("/")
      })



    }







})

app.post("/markers/:id", (req,res) => {
  const markerID = req.params.id;
  const mapID = req.body.map_id;
  db.query(`DELETE FROM markers WHERE id = ${markerID}`)
    .then(data => {
      const redirectUrl = "/maps/" + mapID;
      res.redirect(redirectUrl);
    })
})

app.post("/maps/:id/delete", (req, res) => {
  const id = req.params.id;

  db.query(`
   DELETE FROM maps
   WHERE id = $1;`,
    [id])
    .then(data => {
      res.redirect("/mymaps")
    })
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
