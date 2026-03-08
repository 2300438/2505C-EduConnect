function loadChatbot() {
    // Check if chatbot already exists to prevent duplicates
    if (document.querySelector('.chat-widget')) return;

    const chatbotHTML = `
    <div class="chat-widget">
        <div class="chat-box" id="aiChatBox">
            <div class="chat-header" style="background:#2c3e50; color:white; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0;">EduConnect Assistant</h4>
                <button onclick="toggleChat()" style="background:none; border:none; color:white; cursor:pointer;">✖</button>
            </div>
            <div id="chatMessages" style="flex:1; padding:15px; overflow-y:auto; background:#f4f8fb; display:flex; flex-direction:column; gap:10px;">
                <div class="message ai-message" style="background:white; padding:10px; border-radius:10px; font-size:13px; align-self:flex-start;">Hello! I'm the EduConnect AI. How can I help you today?</div>
            </div>
            <div style="padding:10px; border-top:1px solid #eee; display:flex;">
                <input type="text" id="userInput" placeholder="Ask a question..." 
       style="flex:1; padding:8px; border:1px solid #ddd; border-radius:5px;" 
       onkeypress="if(event.key === 'Enter') { event.preventDefault(); sendMessage(); }">
                <button onclick="sendMessage()" style="background:#3498db; color:white; border:none; margin-left:5px; padding:0 15px; border-radius:5px; cursor:pointer;">➤</button>
            </div>
        </div>
        <button class="chat-toggle-btn" onclick="toggleChat()">✨ Ask EduConnect AI</button>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}


// Logic for opening/closing
function toggleChat() {
    const chatBox = document.getElementById('aiChatBox');
    const toggleBtn = document.querySelector('.chat-toggle-btn');
    
    // Check if the chat is currently hidden
    if (chatBox.style.display === 'none' || chatBox.style.display === '') {
        chatBox.style.display = 'flex';   // Show the chat box
        toggleBtn.style.display = 'none'; // HIDE the toggle button
    } else {
        chatBox.style.display = 'none';   // Hide the chat box
        toggleBtn.style.display = 'flex'; // SHOW the toggle button again
    }
}

// Function to add a message to the chat window
function appendMessage(sender, text) {
    const messagesDiv = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    
    // Auto-scroll to the bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const userText = input.value.trim();
    if (!userText) return;

    const userProfile = {
        name: "Muhammad Yazid",
        role: "Student",
        courses: ["ICT2503", "ICT2504", "ICT2505"]
    };

    // 1. Show User Message
    appendMessage('user', userText);
    input.value = '';

    // 2. Create the AI "Thinking" bubble first!
    const messagesDiv = document.getElementById('chatMessages');
    const tempAiMsg = document.createElement('div');
    tempAiMsg.className = 'message ai-message';
    tempAiMsg.style.cssText = "background:white; padding:10px; border-radius:10px; font-size:13px; align-self:flex-start;";
    tempAiMsg.textContent = "..."; 
    messagesDiv.appendChild(tempAiMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userText,
                profile: userProfile 
            })
        });

        const data = await response.json();

        if (response.status === 429) {
            tempAiMsg.textContent = "⚠️ I'm a bit overwhelmed! Please wait 60 seconds.";
            tempAiMsg.style.color = "red";
        } else if (!response.ok) {
            throw new Error("Server error");
        } else {
            // Update the bubble we created earlier
            tempAiMsg.textContent = data.reply;
        }
    } catch (error) {
        console.error("Chat Error:", error);
        tempAiMsg.textContent = "Sorry, I'm having trouble connecting to my AI brain right now.";
    }
}

// Run the loader when the window opens
window.addEventListener('load', loadChatbot);