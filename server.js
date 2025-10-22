const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let users = {}; // { socketId: {username, status} }

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // New user joins
  socket.on('new-user', (username) => {
    users[socket.id] = { username, status: 'Online' };
    io.emit('update-users', users);
  });

  // Chat message
  socket.on('send-message', (msg) => {
    const user = users[socket.id];
    if(user) {
      io.emit('receive-message', { username: user.username, text: msg });
    }
  });

  // Update status
  socket.on('update-status', (status) => {
    if(users[socket.id]) {
      users[socket.id].status = status;
      io.emit('update-users', users);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('update-users', users);
    console.log('User disconnected:', socket.id);
  });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
