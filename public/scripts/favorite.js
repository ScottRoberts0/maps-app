$(() => {

  $('.fav-btn').click(function() {
   const mapid = $(this).children('.mapid').val()
   const userid = $('.userid').val()
  $.ajax({
      url: "/favorite",
      type: "POST",
      data: { mapid, userid },
      datatype: "json"
    }).done(data => {
      alert(data);
    })
  });

})
