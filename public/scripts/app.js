// $(() => {
//   $.ajax({
//     method: "GET",
//     url: "/api/users"
//   }).done((users) => {
//     console.log(users);
//     for(user of users.users) {
//       $("<div>").text(user.email).appendTo($("body"));
//     }
//   });;
// });

$(() => {
  $.ajax({
    method: "GET",
    url: "/api/maps"
  }).done((maps) => {
    console.log(maps);

    for(map of maps.maps) {
      //let str = `${map.id}, ${map.lat}, ${map.long}, ${map.city}, ${map.user_id}`;
      //$("<div>").text(str).appendTo($("body"));
      $("<div>").attr('id', 'map'+map.id).css({"width": "900px", "height": "580px"}).appendTo($("body"));

      var mapOptions = {
        center: [map.lat, map.long],
        zoom: 10
     }

     // Creating a map object
     var map = new L.map('map'+map.id, mapOptions);

     // Creating a Layer object
     var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

     // Adding layer to the map
     map.addLayer(layer);

    }
  });;
});
