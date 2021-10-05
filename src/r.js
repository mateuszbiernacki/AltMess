const $ = require('jquery');
const { dialog, getCurrentWindow } = require('electron');
const fs = require('fs')


var IP = "127.0.0.1"

fs.readFile('IP', (err, data) => {
    if (err) throw err;

    IP = data.toString()
})

var token = 't';
var login = '';
var type = '';
var friend = '';
var group_id = -1;
var users;


$("#main").hide();
$("#registerwin").hide();
$("#forgotwin").hide();
$("#codewin").hide();
$("#invite-members").hide();
$("#leave-group").hide();
$("#cg-window").hide();
$("#inv-window").hide();


var refreshInterval;

function refresh(){
  var DataToSend = {
    "login": login,
    "token": token
  }
  $.ajax({
    url: 'https://'+IP+'/get_message',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        if (data.mess.type == "cl"){
          console.log("cl");
          return;
        }
        else {
          if (data.mess.type == "dm"){
            console.log("dm");
            console.log(data.mess);
            $("#"+data.mess.from).css("font-weight","Bold");
            new Notification("New DM", { body: "Message from "+data.mess.from })
            if(friend == data.mess.from){
              const u_login = friend;
              DataToSend = {
                "login": login,
                "token": token,
                "friend": u_login
              }
              $.ajax({
                url: 'https://'+IP+'/get_dms',
                data: JSON.stringify(DataToSend),
                dataType: 'json',
                type: 'POST',
                contentType: "application/json",
                traditional: true,
                success: function(data) {
                  if (data.r == 'ok') {
                    $("#invite-members").hide();
                    $("#leave-group").hide();
                    console.log(data);
                    type = "dm"
                    friend = u_login;
                    $("#conversation").empty()
                    var last_a = ""
                    $.each(data.history, function(i, obj) {
                      if (last_a != obj[0]){
                        last_a = obj[0];
                        $("#conversation").append('<div class="author">'+obj[0]+'</div>');
                      }
                      $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
                    });
                    $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
                  }
                  else {
                    alert(data.r);
                  }

                }
              });
            }
          }
          else if (data.mess.type == "gm") {
            console.log("gm");
            console.log(data.mess.from);
            $("#g_"+data.mess.from).css("font-weight","Bold");
            new Notification($("#g_"+data.mess.group).text(), { body: "Message from "+data.mess.from })
            if (group_id == data.mess.group){
              var g_id = group_id;
              DataToSend = {
                "login": login,
                "token": token,
                "group_id": g_id
              }
              $.ajax({
                url: 'https://'+IP+'/get_gms',
                data: JSON.stringify(DataToSend),
                dataType: 'json',
                type: 'POST',
                contentType: "application/json",
                traditional: true,
                success: function(data) {
                  if (data.r == 'ok') {
                    type = "gm";
                    $("#invite-members").show();
                    $("#leave-group").show();
                    group_id = g_id;
                    console.log(data);
                    $("#conversation").empty()
                    var last_a = ""
                    $.each(data.history, function(i, obj) {
                      if (last_a != obj[0]){
                        last_a = obj[0];
                        $("#conversation").append('<div class="author">'+obj[0]+'</div>');
                      }
                      $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
                    });
                    $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
                  }
                  else {
                    alert(data.r);
                  }

                }
              });
            }
          }
          else if (data.mess.type == "new") {
            get_user_list();
            get_group_list();
          }
          refresh();
        }
      }
      else {
        alert(data.r);
      }

    }
});
}




$("#logout").click(function(){
  var DataToSend = {
    "login": login,
    "token": token
  }
  $.ajax({
    url: 'https://'+IP+'/logout',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok.') {
        clearInterval(refreshInterval);
        $("#main").hide();
        $("#registerwin").hide();
        $("#loginwin").show();
        $("#codewin").hide();

        $("#contact-list").empty();
        $("#channels-list").empty();
        $("#conversation").empty();
        $("#channel-title").empty();
        $("#uname").val('');
        $("#upass").val('');
        $('input').val('');

      }
      else {
        alert(data.r);
      }

    }
});
})

$("#forgotpass").click(function(){
  $("#main").hide();
  $("#registerwin").hide();
  $("#loginwin").hide();
  $("#forgotwin").show();
  $("#codewin").hide();
})

$("#invite-button").click(function(){
  var checked_users = [];
  $.each(users, function(i, obj) {
        if ($("#toinv_"+obj).prop('checked')){
          checked_users.push(obj);
        }
      });
  var DataToSend = {
    "login": login,
    "token": token,
    "group_id": group_id,
    "invitees": checked_users
  }
  $.ajax({
    url: 'https://'+IP+'/invite_to_group',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        get_group_list();
        $("#main").show();
        $("#inv-window").hide();
      }
      else {
        alert(data.r);
      }

    }
  });
})

$("#invite-members").click(function(){
  $("#main").hide();
  $("#inv-window").show();
  current_users = [];
    var DataToSend = {
    "login": login,
    "token": token,
    "group_id": group_id
  }
  $.ajax({
    url: 'https://'+IP+'/list_of_group_members',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
        $.each(data, function(i, obj){
            current_users.push(obj);
        });
        console.log(current_users)
        $.each(users.filter(n => !current_users.includes(n)), function(i, obj) {
          $("#users-to-invite").append('<input type="checkbox" id="toinv_'+obj+'"><label>'+obj+'</label></br>')
        });
      }
  });

})

$("#invite-back").click(function(){
  $("#main").show();
  $("#inv-window").hide();
  $('input[type=text]').val('');
  $('input[type=password]').val('');
})

$("#gm-plus").click(function(){
  $("#main").hide();
  $("#cg-window").show();
})

$("#gr-back").click(function(){
  $("#main").show();
  $("#cg-window").hide();
  $('input[type=text]').val('');
  $('input[type=password]').val('');
})

$("#newaccount").click(function(){
  $("#main").hide();
  $("#registerwin").show();
  $("#loginwin").hide();
  $("#forgotwin").hide();
  $("#codewin").hide();
})

$("#backtologin").click(function(){
  $("#main").hide();
  $("#registerwin").hide();
  $("#loginwin").show();
  $("#forgotwin").hide();
  $("#codewin").hide();
  $('input[type=text]').val('');
  $('input[type=password]').val('');
})

$("#fbacktologin").click(function(){
  $("#main").hide();
  $("#registerwin").hide();
  $("#loginwin").show();
  $("#forgotwin").hide();
  $("#codewin").hide();
  $('input[type=text]').val('');
  $('input[type=password]').val('');
})

$("#cbacktologin").click(function(){
  $("#main").hide();
  $("#registerwin").hide();
  $("#loginwin").show();
  $("#forgotwin").hide();
  $("#codewin").hide();
  $('input[type=text]').val('');
  $('input[type=password]').val('');
})

$("#fsubmit").click(function(){
  login = $("#fname").val()
  var DataToSend = {
    "login": login
  }
  $.ajax({
    url: 'https://'+IP+'/forgot_password',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        $("#main").hide();
        $("#registerwin").hide();
        $("#loginwin").hide();
        $("#codewin").show();
        $("#forgotwin").hide();
      }
      else {
        $("#ferror").text(data.r)
      }

    }
});
})

$("#csubmit").click(function(){
  if ($("#cpass1").val() == $("#cpass2").val()){
    if ($("#cpass1").val().length < 7){
      $("#coerror").text("Password must have almost 8 characters.");
      return;
    }
    var DataToSend = {
      "login": login,
      "new_password": $("#cpass1").val(),
      "code": $("#ccode").val()
    }
    console.log(DataToSend);
    $.ajax({
      url: 'https://'+IP+'/change_password',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          $("#main").hide();
          $("#registerwin").hide();
          $("#loginwin").show();
          $("#forgotwin").hide();
          $("#codewin").hide();
          alert("Password was changed.");
        }
        else {
          $("#coerror").text(data.r);
        }

      }
    });
  }
  else {
    $("#coerror").text('Passwords are not mached.');
  }
})

$("#submit").click(function(){
  login = $("#uname").val()
  var DataToSend = {
    "login": login,
    "password": $("#upass").val()
  }
  console.log(DataToSend);
  $.ajax({
    url: 'https://'+IP+'/login',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        token = data.token
        console.log(token);
        $("#main").show();
        $("#registerwin").hide();
        $("#loginwin").hide();
        $("#codewin").hide();
        get_user_list();
        get_group_list();
        refreshInterval = window.setInterval(refresh, 5000);
        refresh();
      }
      else {
        $("#lerror").text(data.r);
      }

    }
});
})

$("#rbutton").click(function(){
  if ($("#rpass1").val() == $("#rpass2").val()){
    if ($("#rpass1").val().length < 7){
      alert("Password must have almost 8 characters.");
      return;
    }
    if ($("#remail").val().includes("@") == false){
      alert("Wrong email format.")
      return;
    }
    var DataToSend = {
      "login": $("#rlogin").val(),
      "password": $("#rpass1").val(),
      "mail": $("#remail").val()
    }
    console.log(DataToSend);
    $.ajax({
      url: 'https://'+IP+'/register',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          $("#main").hide();
          $("#registerwin").hide();
          $("#loginwin").show();
          $("#forgotwin").hide();
        }
        else {
          alert(data.r);
        }

      }
    });
  }
  else {
    alert('Passwords are not mached.')
  }
})

function get_user_list(){
  var DataToSend = {
    "login": login,
    "token": token
  }
  $.ajax({
    url: 'https://'+IP+'/list_of_users',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        users = data.users;
        console.log(users);
        $.each(data.users, function(i, obj) {
          if(obj != login){
            $("#contact-list").append('<li class="contact" id="'+ obj +'">'+obj+'</li>');
          }

        });

      }
      else {
        alert(data.r);
      }

    }
  });
}

function get_group_list(){
  var DataToSend = {
    "login": login,
    "token": token
  }

  $.ajax({
    url: 'https://'+IP+'/list_of_group',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        $("#channels-list").empty()
        $.each(data.groups, function(i, obj) {
          $("#channels-list").append('<li class="group" id="g_'+ obj[0] +'">'+obj[1]+'</li>')
        });

      }
      else {
        alert(data.r);
      }

    }
  });
}

$(".contact").click(function(){
  alert(clickedElement)
})

$('li').click(function(){
      alert( $(this).attr('id') );
   });

$('#contact-list').on('click', 'li', function () {
  const u_login = $(this).attr('id');
  $(this).css("font-weight", "");
  $("#channel-title").text(u_login);
  DataToSend = {
    "login": login,
    "token": token,
    "friend": u_login
  }
  $.ajax({
    url: 'https://'+IP+'/get_dms',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        $("#invite-members").hide();
        $("#leave-group").hide();
        console.log(data);
        type = "dm"
        friend = u_login;
        $("#conversation").empty()
        var last_a = ""
        $.each(data.history, function(i, obj) {
          if (last_a != obj[0]){
            last_a = obj[0];
            $("#conversation").append('<div class="author">'+obj[0]+'</div>');
          }
          $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
        });
        $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
      }
      else {
        alert(data.r);
      }

    }
  });

});

$('#channels-list').on('click', 'li', function () {
  var g_id = $(this).attr('id');
  $(this).css("font-weight", "");
  $("#channel-title").text($("#"+g_id).text());
  g_id = g_id.slice(2);


  DataToSend = {
    "login": login,
    "token": token,
    "group_id": g_id
  }
  $.ajax({
    url: 'https://'+IP+'/get_gms',
    data: JSON.stringify(DataToSend),
    dataType: 'json',
    type: 'POST',
    contentType: "application/json",
    traditional: true,
    success: function(data) {
      if (data.r == 'ok') {
        type = "gm";
        $("#invite-members").show();
        $("#leave-group").show();
        group_id = g_id;
        console.log(data);
        $("#conversation").empty()
        var last_a = ""
        $.each(data.history, function(i, obj) {
          if (last_a != obj[0]){
            last_a = obj[0];
            $("#conversation").append('<div class="author">'+obj[0]+'</div>');
          }
          $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
        });
        $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
          var DataToSend = {
                "login": login,
                "token": token,
                "group_id": group_id
              }
          $.ajax({
            url: 'https://'+IP+'/list_of_group_members',
            data: JSON.stringify(DataToSend),
            dataType: 'json',
            type: 'POST',
            contentType: "application/json",
            traditional: true,
            success: function(data) {
              console.log(data);
              var users_ = "";
              $.each(data, function(i, obj) {
                console.log(obj)
                users_ = users_ + obj + "\n";
              });
              console.log(users_);
              $("#channel-title").attr("title", users_);
            }
        });
      }
      else {
        alert(data.r);
      }

    }
  });
});

$("#send_button").click(function(){
  if (type == "dm"){

    var DataToSend = {
      "login": login,
      "token": token,
      "to": friend,
      "content": $("#content-to-send").val()
    }
    $.ajax({
      url: 'https://'+IP+'/send_dm',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          DataToSend = {
            "login": login,
            "token": token,
            "friend": friend
          }
          $.ajax({
            url: 'https://'+IP+'/get_dms',
            data: JSON.stringify(DataToSend),
            dataType: 'json',
            type: 'POST',
            contentType: "application/json",
            traditional: true,
            success: function(data) {
              if (data.r == 'ok') {
                console.log(data);
                $("#conversation").empty()
                var last_a = ""
                $.each(data.history, function(i, obj) {
                  if (last_a != obj[0]){
                    last_a = obj[0];
                    $("#conversation").append('<div class="author">'+obj[0]+'</div>');
                  }
                  $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
                });
                $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
              }
              else {
                alert(data.r);
              }

            }
          });
        }
        else {
          alert(data.r);
        }

      }
    });
  } else {
    var DataToSend = {
      "login": login,
      "token": token,
      "group_id": group_id,
      "content": $("#content-to-send").val()
    }
    $.ajax({
      url: 'https://'+IP+'/send_gm',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          DataToSend = {
            "login": login,
            "token": token,
            "group_id": group_id
          }
          $.ajax({
            url: 'https://'+IP+'/get_gms',
            data: JSON.stringify(DataToSend),
            dataType: 'json',
            type: 'POST',
            contentType: "application/json",
            traditional: true,
            success: function(data) {
              if (data.r == 'ok') {
                console.log(data);
                $("#conversation").empty()
                var last_a = ""
                $.each(data.history, function(i, obj) {
                  if (last_a != obj[0]){
                    last_a = obj[0];
                    $("#conversation").append('<div class="author">'+obj[0]+'</div>');
                  }
                  $("#conversation").append('<div title="'+obj[2].slice(0, -10)+'" class="message">'+obj[1]+'</div>');
                });
                $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
              }
              else {
                alert(data.r);
              }

            }
          });
        }
        else {
          alert(data.r);
        }

      }
    });
  }
  })

$("#cgsubmit").click(function(){
    if ($("#cgname").val().length < 2){
      $("#crerror").text("Group name must have almost 3 characters.");
      return;
    }
    var DataToSend = {
      "login": login,
      "token": token,
      "group_name": $("#cgname").val()
    }
    $.ajax({
      url: 'https://'+IP+'/create_group',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          $("#main").show();
          $("#cg-window").hide();
          get_group_list();
        }
        else {
          alert(data.r);
        }

      }
    });
  })

$("#leave-group").click(function(){

    var DataToSend = {
      "login": login,
      "token": token,
      "group_id": group_id
    }
    $.ajax({
      url: 'https://'+IP+'/leave_group',
      data: JSON.stringify(DataToSend),
      dataType: 'json',
      type: 'POST',
      contentType: "application/json",
      traditional: true,
      success: function(data) {
        if (data.r == 'ok') {
          get_group_list();
          $("#invite-members").hide();
          $("#leave-group").hide();
          $("#channel-title").text("");
          $("#channel-title").attr("title","");
          $("#conversation").empty();

        }
        else {
          alert(data.r);
        }

      }
    });
  })
