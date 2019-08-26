/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router  = express.Router();


module.exports = (db) => {
  router.get("/:id", (req, res) => {
    let id = req.params.id;
    db.query(`SELECT * FROM maps WHERE id = $1;`, [id])
      .then(data => {
        const maps = data.rows;
        db.query(`SELECT * FROM markers RIGHT JOIN maps ON maps.id = map_id WHERE map_id = $1;`, [id])
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
          let templateVars = { maps: maps[0] }
          console.log(maps[0])


          res.render("maps_show", templateVars)
        })
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });
  return router;
};
