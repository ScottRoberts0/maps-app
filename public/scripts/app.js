$(() => {
  $.ajax({
    method: "GET",
    url: "/api/maps/"
  }).done((mapsList) => {

    for (map of mapsList.maps) {
      $("<div>").attr('id', 'map' + map.id).css({ "width": "900px", "height": "580px" }).appendTo($(".carousel-inner"));

      let mapOptions = {
        center: [map.lat, map.long],
        zoom: 11
      }

      // Creating a map object
      let newMap = new L.map('map' + map.id, mapOptions);

      // Creating a Layer object
      let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

      // Adding layer to the map
      newMap.addLayer(layer);

      //Adds markers to our map
      for (let marker of map.markers) {
        let markerOptions = {
          title: marker.title,
          clickable: true,
       }

        // Creating a marker
        let newMarker = L.marker([marker.lat, marker.long], markerOptions);
        // Adding marker to the map
        newMarker.addTo(newMap);

        // Adding popup to the marker
        newMarker.bindPopup(`
        <h1>${marker.title}</h1>
        <p>${marker.description}</p>
        <img src=${marker.img} style="width: 50px; height: 50px;">

        `);
        newMarker.addTo(newMap); // Adding marker to the map
      }
    }
  });;
});
