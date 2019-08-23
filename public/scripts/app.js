$(() => {
  $.ajax({
    method: "GET",
    url: "/api/users"
  }).done((users) => {
    console.log(users);
    for(user of users.users) {
      $("<div>").text(user.email).appendTo($("body"));
    }
  });;
});
