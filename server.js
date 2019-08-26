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


app.get("/maps/:id", (req, res) => {
  templateVars = {
    id: req.params.id
  }
  res.render("maps_show", templateVars);
});




const getAllMaps = function (){
  let maps = [];
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
    })
  })

}


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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
