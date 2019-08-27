$(() => {
  const id = $('#id').text();
  const url = "/api/maps/" + id;

  $.ajax({
    method: "GET",
    url: url
  }).done((mapsList) => {

    for (map of mapsList.maps) {
      $("<div>").attr('id', 'map' + map.id).css({ "width": "900px", "height": "580px" }).appendTo($("body"));





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


        let markup = `
        <tr>
          <td>${marker.title}</td>
          <td>${marker.description}</td>
          <td>${marker.address}</td>
          <td>
            <form method="POST" action="/maps/${map.id}">
              <input type="hidden" name="marker_id" id="hiddenField" value="${marker.id}" />
              <input type="hidden" name="map_id" id="hiddenField" value="${map.id}" />
              <button type="submit" class="btn btn-danger">Delete</button>
            </form>
          </td>
        </tr>`;


      $("tbody").append(markup);


      }
    }
  });;
});
