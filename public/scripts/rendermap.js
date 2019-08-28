$(() => {
  const id = $('#id').text();
  const url = "/api/maps/" + id;
  const userid = $('#userid').val();

  $.ajax({
    method: "GET",
    url: url
  }).done((mapsList) => {

    for (map of mapsList.maps) {
      $("<div>").attr({'id': 'map' + map.id, 'class': "border border-dark"}).css({ "width": "70vw", "height": "70vh" }).appendTo($(".map-body"));
      $("<ul>").appendTo($("body"));
      $("<ul>").append(`<li>`)
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
        <a href=${marker.img}><img src=${marker.img} style="width: 50px; height: 50px;"></a>
        `);

        newMarker.addTo(newMap); // Adding marker to the map



        let markup = `
        <tr>
          <td>${marker.title}</td>
          <td>${marker.description}</td>
          <td>${marker.address}</td>
          <td>${marker.email}</td>
          <td>
          `;

        if(userid == marker.user_id){
          markup += `<form method="POST" action="/maps/${map.id}">
          <input type="hidden" name="marker_id" id="hiddenField" value="${marker.id}" />
          <input type="hidden" name="map_id" id="hiddenField" value="${map.id}" />
          <button type="submit" class="btn btn-danger">Delete</button>
        </form>`;
        }
        markup += `

          </td>
        </tr>`;


      $("tbody").append(markup);


      }
    }
  });;
});
