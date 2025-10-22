const socket = io();

// Get username from URL
const params = new URLSearchParams(window.location.search);
let username = params.get('user') || 'Guest';
document.querySelector('.profile .username').textContent = username;

// Notify server
socket.emit('join', username);

// Elements
const input = document.querySelector('.chat-input input');
const sendBtn = document.querySelector('.chat-input button');
const messages = document.querySelector('.messages');
const friendList = document.getElementById('friend-list');

// Send message
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e => { if(e.key==='Enter') sendMessage(); });

function sendMessage(){
  if(input.value.trim() === '') return;
  socket.emit('send-message', input.value);
  input.value = '';
}

// Receive messages
socket.on('receive-message', data => {
  const msg = document.createElement('div');
  msg.classList.add('message');
  msg.innerHTML = `
    <img src="assets/avatar.png" class="avatar">
    <div class="message-content">
      <div class="username">${data.username}</div>
      <div class="text">${data.text}</div>
    </div>
  `;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
});

// Update user list
socket.on('update-users', userArray => {
  friendList.innerHTML = '';
  userArray.forEach(u => {
    const f = document.createElement('div');
    f.classList.add('friend', 'online');
    f.textContent = u;
    friendList.appendChild(f);
  });
});

// Settings modal
const settingsModal = document.getElementById('settings-modal');
const settingsTriggers = document.querySelectorAll('#settings-trigger, #settings-trigger-btn');
const closeSettings = settingsModal.querySelector('.close-settings');
const usernameInput = document.getElementById('username-input');
const statusInput = document.getElementById('status-input');
const saveSettings = document.getElementById('save-settings');

settingsTriggers.forEach(el => el.addEventListener('click', ()=>settingsModal.style.display='flex'));
closeSettings.addEventListener('click', ()=>settingsModal.style.display='none');
saveSettings.addEventListener('click', ()=>{
  username = usernameInput.value;
  document.querySelector('.profile .username').textContent = username;
  socket.emit('update-status', statusInput.value);
  settingsModal.style.display='none';
});
