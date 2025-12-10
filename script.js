// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCHowKtRMu0CrM17Td7ah6pxib8pdCCcHs",
    authDomain: "whatsapp-140cd.firebaseapp.com",
    projectId: "whatsapp-140cd",
    storageBucket: "whatsapp-140cd.firebasestorage.app",
    messagingSenderId: "933426843914",
    appId: "1:933426843914:web:d3bfbc12f006a391226af3",
    measurementId: "G-P9RX7C8JRQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const convList = document.getElementById('conv-list');
const messagesArea = document.getElementById('messages-area');
const chatHeader = document.getElementById('chat-header');
const container = document.querySelector('.container');

let currentConversation = null;

// Function to fetch and display conversations
function loadConversations() {
    db.collection('conversations').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                const convData = change.doc.data();
                const convId = change.doc.id;
                const lastMessage = convData.lastMessage || { text: 'No messages yet', timestamp: '' };
                const pushName = (convData.profileHistory && convData.profileHistory.length > 0)
                    ? convData.profileHistory[convData.profileHistory.length - 1].pushName
                    : 'Unknown User';

                let convElement = document.getElementById(convId);
                if (!convElement) {
                    convElement = document.createElement('div');
                    convElement.id = convId;
                    convElement.classList.add('conversation-item');
                    convElement.innerHTML = `
                        <img src="https://via.placeholder.com/50" alt="Profile" class="profile-pic">
                        <div class="conversation-details">
                            <p class="conversation-name">${pushName}</p>
                            <p class="last-message">${lastMessage.text}</p>
                        </div>
                    `;
                    convList.prepend(convElement); // Prepend to show newest first
                } else {
                    // Update existing element
                    convElement.querySelector('.conversation-name').textContent = pushName;
                    convElement.querySelector('.last-message').textContent = lastMessage.text;
                }

                convElement.onclick = () => {
                    loadMessages(convId, pushName);
                    // For mobile view
                    container.classList.add('chat-active');
                    // Set active class
                    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
                    convElement.classList.add('active');
                };
            }
        });
    });
}


// Function to load messages for a conversation
function loadMessages(convId, pushName) {
    currentConversation = convId;
    messagesArea.innerHTML = ''; // Clear previous messages
    
    // Update chat header
    chatHeader.innerHTML = `
        <span class="back-button" onclick="goBack()">&larr;</span>
        <p>${pushName}</p>
    `;

    const messagesRef = db.collection('conversations').doc(convId).collection('messages').orderBy('timestamp');

    messagesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const msgData = change.doc.data();
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.textContent = msgData.text;

                if (msgData.sender === 'bot') {
                    messageElement.classList.add('bot');
                } else {
                    messageElement.classList.add('user');
                }
                messagesArea.appendChild(messageElement);
                messagesArea.scrollTop = messagesArea.scrollHeight; // Scroll to bottom
            }
        });
    });
}

// Function to go back to conversation list on mobile
function goBack() {
    container.classList.remove('chat-active');
    currentConversation = null;
}

// Initial load
loadConversations();