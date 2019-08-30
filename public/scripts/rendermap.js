$(() => {
  const id = $('#id').text();
  const url = "/api/maps/" + id;
  const userid = $('#userid').val();


  $('#lat').hide();
  $('#long').hide();

  $.ajax({
    method: "GET",
    url: url
  }).done((mapsList) => {

    for (map of mapsList.maps) {

      $("<div>").attr({'id': 'map' + map.id, 'class': "border border-dark"}).css({ "width": "70vw", "height": "70vh" }).appendTo($(".map-body"));

      $("<h1>").html(`${map.title} - <em>${map.city}</em>`).appendTo($(".map-title"))

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
       let popUpText = `
        <h4>${marker.title}</h4>
        <a href=${marker.img}><img src=${marker.img} style="width: 300px; height: 200px;"></a>
        <p><strong>${marker.description}</strong></p>
        `;
       if(marker.address){
        popUpText += `<p> ${marker.address} </p>`;
       }else{
         popUpText += `<p> ${marker.lat}, ${maker.long} </p>`;
       }

       popUpText += `<p> Created By: <a href="/users/${marker.user_id}">${marker.email}</a> </p>`;

       newMarker.bindPopup(popUpText);
        newMarker.addTo(newMap); // Adding marker to the map



        let markup = `
        <tr>
          <td>${marker.title}</td>
          <td>${marker.description}</td>
          <td>${marker.address}</td>
          <td><a href="/users/${marker.user_id}">${marker.email}</a></td>
          <td>
          `;

        if(userid == marker.user_id){
          markup += `<form method="POST" action="/markers/${marker.id}">
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

      let theMarker = {};
      newMap.on("click", function(e){
        if(userid){
          if (theMarker != undefined) {
            newMap.removeLayer(theMarker);
          };
        theMarker = new L.Marker([e.latlng.lat, e.latlng.lng]).addTo(newMap);

        const lat = Number(e.latlng.lat.toFixed(6));
        const long = Number(e.latlng.lng.toFixed(6));

        $(".user-input").css({ "border": "1px solid green", "border-radius": "7px", "box-shadow": "0 0 10px green" });
        $("#lat").attr('readonly','readonly');
        $("#long").attr('readonly','readonly');
        $("#addressheader").text("Latitude, Longitude");
        $('#address').hide();
        $('#lat').show();
        $('#long').show();
        $('#lat').val(lat);
        $('#long').val(long);
        }

      })

    }
  });;
});
