// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT       = process.env.PORT || 8080;
const ENV        = process.env.ENV || "development";
const express    = require("express");
const bodyParser = require("body-parser");
const sass       = require("node-sass-middleware");
const app        = express();
const morgan     = require('morgan');

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

      for(let map of maps){
        map.markers = [];
        for(let marker of markers){
          if(marker.map_id === map.id){
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
app.get("/", (req, res) => {
  db.query(`SELECT * FROM maps LIMIT 10;`)
  .then(data => {
    maps = data.rows;
    db.query(`SELECT * FROM markers;`)
    .then(data => {
      const markers = data.rows;

      for(let map of maps){
        map.markers = [];
        for(let marker of markers){
          if(marker.map_id === map.id){
            map.markers.push(marker);
          }
         }

      }

      templateVars = {
        maps: maps
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
  opencage.geocode({q: city}, '6d4de6cf56fc4852bef89f1d413e2b29').then(data => {
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
        const redirectUrl =  "/maps/" + id;
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
