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
  }).done((mapsList) => {

    for (map of mapsList.maps) {
      $("<div>").attr('id', 'map' + map.id).css({ "width": "900px", "height": "580px" }).appendTo($("body"));

      let mapOptions = {
        center: [map.lat, map.long],
        zoom: 10
      }

      // Creating a map object
      let newMap = new L.map('map' + map.id, mapOptions);

      // Creating a Layer object
      let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

      // Adding layer to the map
      newMap.addLayer(layer);

      //Adds markers to our map
      for (let marker of map.markers) {
        // Creating a marker
        let newMarker = L.marker([marker.lat, marker.long]);
        // Adding marker to the map
        newMarker.addTo(newMap);

      }
    }
  });;
});
