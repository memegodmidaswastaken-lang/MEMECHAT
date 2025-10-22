const socket = io();

// Prompt for username
let username = prompt("Enter your username:");
if(!username) username = "User" + Math.floor(Math.random()*1000);
document.querySelector('.profile .username').textContent = username;

// Notify server
socket.emit('new-user', username);

// Elements
const input = document.querySelector('.chat-input input');
const sendBtn = document.querySelector('.chat-input button');
const messages = document.querySelector('.messages');
const friendList = document.getElementById('friend-list');

// Send message
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });

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
socket.on('update-users', users => {
  friendList.innerHTML = '';
  Object.values(users).forEach(user => {
    const f = document.createElement('div');
    f.classList.add('friend', user.status==='Online'?'online':'offline');
    f.textContent = user.username;
    friendList.appendChild(f);
  });
});

// Settings
const settingsModal = document.getElementById('settings-modal');
const settingsTriggers = document.querySelectorAll('#settings-trigger, #settings-trigger-btn');
const closeSettings = settingsModal.querySelector('.close-settings');
const usernameInput = document.getElementById('username-input');
const statusInput = document.getElementById('status-input');
const saveSettings = document.getElementById('save-settings');

settingsTriggers.forEach(el => el.addEventListener('click', () => settingsModal.style.display='flex'));
closeSettings.addEventListener('click', () => settingsModal.style.display='none');
saveSettings.addEventListener('click', () => {
  username = usernameInput.value;
  document.querySelector('.profile .username').textContent = username;
  socket.emit('update-status', statusInput.value);
  settingsModal.style.display='none';
});

// Account modal, close by click outside, etc. (reuse previous code)
const accountModal = document.getElementById('account-modal');
const closeBtn = accountModal.querySelector('.close-btn');
closeBtn.addEventListener('click', () => accountModal.style.display = 'none');

document.addEventListener('click', e => {
  if (e.target.closest('.message .avatar') || e.target.closest('.friend')) {
    const userName = e.target.closest('.message')?.querySelector('.username')?.textContent 
                     || e.target.textContent;
    const status = e.target.closest('.friend')?.classList.contains('online') ? 'Online' : 'Offline';
    accountModal.querySelector('.username').textContent = userName;
    accountModal.querySelector('.status').textContent = status;
    accountModal.style.display = 'flex';
  }
});
accountModal.addEventListener('click', e => { if(e.target===accountModal) accountModal.style.display='none'; });
