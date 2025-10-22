const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');

// Load users
let users = {};
if(fs.existsSync(USERS_FILE)){
    users = fs.readJsonSync(USERS_FILE);
}else{
    fs.writeJsonSync(USERS_FILE, users);
}

// Serve login page
app.get('/', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// Handle login/register
app.post('/login', (req, res) => {
    const { username, password, action } = req.body;
    if(action === 'register'){
        if(users[username]) return res.send('Username exists!');
        users[username] = { password, status: 'Online' };
        fs.writeJsonSync(USERS_FILE, users);
        return res.redirect('/chat?user='+username);
    } else if(action === 'login'){
        if(!users[username] || users[username].password !== password) return res.send('Invalid credentials!');
        users[username].status = 'Online';
        fs.writeJsonSync(USERS_FILE, users);
        return res.redirect('/chat?user='+username);
    }
});

// Serve chat page
app.get('/chat', (req,res)=>{
    if(!req.query.user || !users[req.query.user]) return res.redirect('/');
    res.sendFile(__dirname + '/public/index.html');
});

// Socket.io real-time
let connectedUsers = {}; // { socketId: username }

io.on('connection', socket => {
    console.log('Connected:', socket.id);

    socket.on('join', username => {
        connectedUsers[socket.id] = username;
        io.emit('update-users', Object.keys(connectedUsers));
    });

    socket.on('send-message', msg => {
        const username = connectedUsers[socket.id];
        io.emit('receive-message', { username, text: msg });
    });

    socket.on('disconnect', ()=>{
        delete connectedUsers[socket.id];
        io.emit('update-users', Object.keys(connectedUsers));
    });
});

http.listen(3000, ()=> console.log('Server running on http://localhost:3000'));
