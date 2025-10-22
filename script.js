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
