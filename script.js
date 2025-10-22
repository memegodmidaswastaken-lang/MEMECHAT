// Chat input
const input = document.querySelector('.chat-input input');
const sendBtn = document.querySelector('.chat-input button');
const messages = document.querySelector('.messages');

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  if (input.value.trim() === '') return;
  const message = document.createElement('div');
  message.classList.add('message');
  message.innerHTML = `
    <img src="assets/avatar.png" class="avatar">
    <div class="message-content">
      <div class="username">You</div>
      <div class="text">${input.value}</div>
    </div>
  `;
  messages.appendChild(message);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
}

// Account Modal
const accountModal = document.getElementById('account-modal');
const closeBtn = accountModal.querySelector('.close-btn');
closeBtn.addEventListener('click', () => accountModal.style.display = 'none');

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
const settingsTriggers = document.querySelectorAll('#settings-trigger, #settings-trigger-btn');
const closeSettings = settingsModal.querySelector('.close-settings');
const usernameInput = document.getElementById('username-input');
const statusInput = document.getElementById('status-input');
const saveSettings = document.getElementById('save-settings');

settingsTriggers.forEach(el => el.addEventListener('click', () => settingsModal.style.display = 'flex'));
closeSettings.addEventListener('click', () => settingsModal.style.display = 'none'));
saveSettings.addEventListener('click', () => {
  document.querySelector('.profile .username').textContent = usernameInput.value;
  settingsModal.style.display = 'none';
});

// Call Modal
const callModal = document.getElementById('call-modal');
const endCallBtn = document.getElementById('end-call-btn');
endCallBtn.addEventListener('click', () => callModal.style.display = 'none'));

// Account modal open
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

// Close modals by clicking outside
[accountModal, settingsModal, callModal].forEach(modal => {
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
});
