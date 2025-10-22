// Chat input functionality
const input = document.querySelector('.chat-input input');
const sendBtn = document.querySelector('.chat-input button');
const messages = document.querySelector('.messages');

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});

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

closeBtn.addEventListener('click', () => {
  accountModal.style.display = 'none';
});

// Open account modal when clicking a user in chat or friend list
document.addEventListener('click', (e) => {
  if (e.target.closest('.message .avatar') || e.target.closest('.friend')) {
    const userName = e.target.closest('.message')?.querySelector('.username')?.textContent 
                     || e.target.textContent;
    const status = e.target.closest('.friend')?.classList.contains('online') ? 'Online' : 'Offline';

    accountModal.querySelector('.username').textContent = userName;
    accountModal.querySelector('.status').textContent = status;
    accountModal.style.display = 'flex';
  }
});

// Close modal by clicking outside the card
accountModal.addEventListener('click', (e) => {
  if (e.target === accountModal) accountModal.style.display = 'none';
});
