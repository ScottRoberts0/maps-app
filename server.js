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
  res.render("map_create");
})

app.get("/maps/:id", (req, res) => {
  templateVars = {
    id: req.params.id
  }
  res.render("maps_show", templateVars);
});


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
            maps: maps
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
      if (bcrypt.compareSync(password, user.password)) {
        return user
      }
      else {
        return null;
      }
    })
};

const createNewUser = function(email, password) {
  return db.query(`INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *;`, [email, password])
  .then(data => {
    if(data.rows[0]){
      return data.rows[0];
    }else{
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
  res.render("register")
})

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPass = bcrypt.hashSync(password, 10);
  getUserInfo(email)
    .then(userInfo => {
      if (userInfo) {
        return res.status(400).send('email address has already been registered');
      }else{
        createNewUser(email, hashedPass)
        .then(user => {
          req.session.userEmail = user.email;
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
        res.send({ error: "Username or password does not exist" });
        return;
      }
      else {
        req.session.userEmail = user.email;
        res.redirect("/")
      }
    })
    .catch(error => res.send(error));
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
            user: req.session.userEmail
          }
          res.render("index", templateVars);
        })
    })
});

const opencage = require('opencage-api-client');


app.post("/maps/create", (req, res) => {
  const title = req.body.title;
  const city = req.body.city;
  const img = req.body.img;
  opencage.geocode({ q: city }).then(data => {
    // console.log(JSON.stringify(data));
    if (data.status.code == 200) {
      if (data.results.length > 0) {
        var place = data.results[0];


        const lat = place.geometry.lat;
        const long = place.geometry.lng;
        // console.log(lat);
        // console.log(long);
        // console.log(city)
        // console.log(title)
        // console.log(img)
        //  db.query(`
        //  INSERT INTO maps (lat, long, city, title, img, user_id)
        //  VALUES (${lat}, ${long}, ${city}, ${title}, ${img}, 1)
        //  RETURNING *;`)
        db.query(`INSERT INTO maps (lat, long, city, title, img, user_id)
        VALUES (${lat}, ${long}, '${city}', '${title}', '${img}', 1)
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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
