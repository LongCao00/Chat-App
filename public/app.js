// public/app.js
$(function () {
    const socket = io();
  
    $('form').submit(function(e) {
      e.preventDefault();
      const message = $('#m').val();
      if (message) {
        socket.emit('chat message', message);
        $('#m').val('');
      }
      return false;
    });
  
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg.username + ': ' + msg.message));
      // Scroll to the bottom of the messages
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });
  
    // Join a room
    $('#roomForm').submit(function(e) {
      e.preventDefault();
      const room = $('#room').val();
      if (room) {
        socket.emit('join room', room);
      }
      return false;
    });
  
    // Private messaging
    $('#privateForm').submit(function(e) {
      e.preventDefault();
      const recipient = $('#recipient').val();
      const message = $('#privateMessage').val();
      if (recipient && message) {
        socket.emit('private message', { recipient, message });
        $('#privateMessage').val('');
      }
      return false;
    });
  
    // Handle private messages
    socket.on('private message', function(msg){
      $('#messages').append($('<li>').text('(Private) ' + msg.sender + ': ' + msg.message));
      // Scroll to the bottom of the messages
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });
  
    // Fetch current user information
    $.get('/user', function(user) {
      if (user) {
        $('#username').text(user.username);
      }
    });
  });
  