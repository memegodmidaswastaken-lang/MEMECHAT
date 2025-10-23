// server.js
const fs = require('fs-extra');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const DB_FILE = './db.json';
let db = fs.existsSync(DB_FILE) ? fs.readJsonSync(DB_FILE) : {
  users:{}, servers:{}, reports:[], globalBans:[], registrationRequests:[], achievements:[]
};

// Ensure admin exists
if(!db.users['memegodmidas']){
  db.users['memegodmidas'] = {
    password: "Godsatan1342",
    nickname: "Admin",
    globalAdmin: true,
    blocked: [],
    permissions: {
      kick: true, ban: true, timeout: true, manageBadges: true, manageNicknames:true
    },
    achievements: [],
    profileBadges:[]
  };
  fs.writeJsonSync(DB_FILE, db, {spaces:2});
}

const connectedUsers = {}; // socket.id -> username

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

// File uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Save DB helper
function saveDB(){ fs.writeJsonSync(DB_FILE, db, {spaces:2}); }
function usernameForSocket(socket){ return connectedUsers[socket.id]; }
function getAdminSockets(){ 
  const sockets = [];
  for(const [sid, uname] of Object.entries(connectedUsers)){
    if(db.users[uname]?.globalAdmin){
      const s = io.sockets.sockets.get(sid);
      if(s) sockets.push(s);
    }
  }
  return sockets;
}

// -------------------
// Registration/Login
// -------------------
app.post('/login', (req,res)=>{
  const { username, password, action } = req.body;
  if(!username || !password) return res.status(400).send('username & password required');

  if(action==='register'){
    if(db.users[username]) return res.status(400).send('Username taken!');
    db.users[username] = {
      password, nickname:"", globalAdmin:false, blocked:[], permissions:{}, achievements:[], profileBadges:[]
    };
    db.registrationRequests.push({id:'rr-'+Date.now(), username, createdAt:Date.now(), status:'pending'});
    saveDB();
    getAdminSockets().forEach(s => s.emit('new-registration-request',{username}));
    return res.send('Registration request sent to admin.');
  } else {
    if(!db.users[username] || db.users[username].password!==password)
      return res.status(400).send('Invalid credentials');
    return res.redirect('/chat?user='+encodeURIComponent(username));
  }
});

app.get('/chat',(req,res)=>{
  const user = req.query.user;
  if(!user || !db.users[user]) return res.redirect('/');
  res.sendFile(__dirname+'/public/index.html');
});

// -------------------
// Socket.io
// -------------------
io.on('connection', socket=>{
  // login
  socket.on('login',{username})=>{
    if(!username || !db.users[username]) return socket.emit('login-failed');
    connectedUsers[socket.id] = username;
    socket.emit('login-success',{username});
    socket.emit('load-data', db);
  });

  // send message
  socket.on('send-message', ({server, channel, text})=>{
    const user = usernameForSocket(socket);
    if(!user) return;
    if(!db.servers[server]) db.servers[server] = {channels:{}, owner:user, mutedUsers:{}, bannedUsers:[], userXP:{}};
    if(!db.servers[server].channels[channel]) db.servers[server].channels[channel] = [];
    const msg = {id:'m-'+Date.now(), username:user, text, timestamp:Date.now()};
    db.servers[server].channels[channel].push(msg);
    db.servers[server].userXP[user] = (db.servers[server].userXP[user]||0)+10;
    saveDB();
    io.emit('receive-message',{server, channel, message:msg, userXP: db.servers[server].userXP[user]});
  });

  // private message
  socket.on('send-dm', ({target,text})=>{
    const sender = usernameForSocket(socket);
    if(!sender || !db.users[target]) return;
    io.sockets.sockets.forEach(s=>{
      const uname = connectedUsers[s.id];
      if(uname===target || uname===sender) s.emit('receive-dm',{from:sender,to:target,text});
    });
  });

  // nicknames
  socket.on('set-nickname', ({nickname})=>{
    const user = usernameForSocket(socket);
    if(!user) return;
    db.users[user].nickname = nickname;
    saveDB();
    io.emit('nickname-updated',{user,nickname});
  });

  // moderation & permissions (kick/ban/timeout)
  socket.on('moderation-action', payload=>{
    const actor = usernameForSocket(socket);
    if(!actor) return;
    const perms = db.users[actor].globalAdmin || false;
    if(!perms) return socket.emit('moderation-denied');
    // handle kick/ban/timeout globally or per server
    // simplified for template
    io.emit('moderation-occurred', payload);
  });

  // disconnect
  socket.on('disconnect',()=>{ delete connectedUsers[socket.id]; });
});

// -------------------
// Start server
// -------------------
http.listen(3000, ()=>console.log('Server running on http://localhost:3000'));
