const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000; // fixed for Electron
const DB_FILE = path.join(__dirname, 'db.json');

let db = { users: {}, servers: {} };
if(fs.existsSync(DB_FILE)) db = fs.readJsonSync(DB_FILE);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Login/Register
app.get('/', (req,res)=> res.sendFile(__dirname+'/public/login.html'));

app.post('/login',(req,res)=>{
  const {username,password,action} = req.body;
  if(action==='register'){
    if(db.users[username]) return res.send('Username exists!');
    db.users[username] = { password, status:'Online', servers:[] };
    fs.writeJsonSync(DB_FILE,db);
    return res.redirect('/chat?user='+username);
  } else {
    if(!db.users[username] || db.users[username].password!==password) return res.send('Invalid credentials!');
    db.users[username].status = 'Online';
    fs.writeJsonSync(DB_FILE,db);
    return res.redirect('/chat?user='+username);
  }
});

// Chat page
app.get('/chat',(req,res)=>{
  if(!req.query.user || !db.users[req.query.user]) return res.redirect('/');
  res.sendFile(__dirname+'/public/index.html');
});

// Socket.io
let connectedUsers = {}; // socketId: username

io.on('connection', socket=>{
  socket.on('join', username=>{
    connectedUsers[socket.id] = username;
    socket.emit('load-data', db);
    io.emit('update-users', connectedUsers);
  });

  socket.on('send-message', ({server, channel, text})=>{
    if(!db.servers[server] || !db.servers[server].channels[channel]) return;
    const message = { username: connectedUsers[socket.id], text, timestamp: Date.now() };
    db.servers[server].channels[channel].push(message);
    fs.writeJsonSync(DB_FILE, db);
    io.emit('receive-message', { server, channel, message });
  });

  socket.on('create-server', ({serverName})=>{
    const user = connectedUsers[socket.id];
    if(!user) return;
    const serverId = 'srv-'+Date.now();
    db.servers[serverId] = { name: serverName, owner: user, channels: { general: [] } };
    db.users[user].servers.push(serverId);
    fs.writeJsonSync(DB_FILE, db);
    io.emit('server-updated', db.servers);
  });

  socket.on('create-channel', ({server, channelName})=>{
    const user = connectedUsers[socket.id];
    if(!db.servers[server] || db.servers[server].owner!==user) return;
    db.servers[server].channels[channelName] = [];
    fs.writeJsonSync(DB_FILE, db);
    io.emit('server-updated', db.servers);
  });

  socket.on('update-status', status=>{
    const user = connectedUsers[socket.id];
    if(user && db.users[user]){
      db.users[user].status = status;
      fs.writeJsonSync(DB_FILE, db);
      io.emit('update-users', connectedUsers);
    }
  });

  socket.on('disconnect', ()=>{
    delete connectedUsers[socket.id];
    io.emit('update-users', connectedUsers);
  });

  // WebRTC signaling
  socket.on('webrtc-offer', data=>{
    const targetSocket = getSocketByUsername(data.target);
    if(targetSocket) targetSocket.emit('webrtc-offer',{ offer:data.offer, sender:connectedUsers[socket.id] });
  });

  socket.on('webrtc-answer', data=>{
    const targetSocket = getSocketByUsername(data.target);
    if(targetSocket) targetSocket.emit('webrtc-answer',{ answer:data.answer });
  });

  socket.on('webrtc-candidate', data=>{
    const targetSocket = getSocketByUsername(data.target);
    if(targetSocket) targetSocket.emit('webrtc-candidate',{ candidate:data.candidate });
  });
});

function getSocketByUsername(username){
  const id = Object.keys(connectedUsers).find(k=>connectedUsers[k]===username);
  return id ? io.sockets.sockets.get(id) : null;
}

http.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
