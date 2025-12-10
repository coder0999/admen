import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const convList = document.getElementById('conv-list');
const messagesArea = document.getElementById('messages-area');
const chatHeader = document.getElementById('chat-header');
const container = document.querySelector('.container');

let currentConversation = null;
let unsubscribeMessages = null;

// Function to fetch and display conversations
function loadConversations() {
    const conversationsRef = collection(db, 'conversations');
    onSnapshot(conversationsRef, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                const convData = change.doc.data();
                const convId = change.doc.id;
                
                // Get the latest profile data
                const pushName = (convData.profileHistory && convData.profileHistory.length > 0)
                    ? convData.profileHistory[convData.profileHistory.length - 1].pushName
                    : 'Unknown User';
                const pfpUrl = (convData.profileHistory && convData.profileHistory.length > 0)
                    ? convData.profileHistory[convData.profileHistory.length - 1].pfpUrl
                    : 'https://via.placeholder.com/50';


                let convElement = document.getElementById(convId);
                if (!convElement) {
                    convElement = document.createElement('div');
                    convElement.id = convId;
                    convElement.classList.add('conversation-item');
                    convList.prepend(convElement); // Prepend to show newest first
                }

                // Update content
                convElement.innerHTML = `
                    <img src="${pfpUrl}" alt="Profile" class="profile-pic" onerror="this.src='https://via.placeholder.com/50'">
                    <div class="conversation-details">
                        <p class="conversation-name">${pushName}</p>
                        <p class="last-message">Loading...</p> 
                    </div>
                `;

                // Fetch last message for each conversation
                const messagesQuery = query(collection(db, 'conversations', convId, 'messages'), orderBy('timestamp', 'desc'));
                onSnapshot(messagesQuery, msgSnapshot => {
                    if (!msgSnapshot.empty) {
                        const lastMsg = msgSnapshot.docs[0].data();
                        const lastMessageElem = convElement.querySelector('.last-message');
                        if (lastMessageElem) {
                           lastMessageElem.textContent = lastMsg.text || 'No messages';
                        }
                    } else {
                        const lastMessageElem = convElement.querySelector('.last-message');
                         if (lastMessageElem) {
                           lastMessageElem.textContent = 'No messages yet';
                        }
                    }
                });

                convElement.onclick = () => {
                    loadMessages(convId, pushName, pfpUrl);
                    container.classList.add('chat-active');
                    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
                    convElement.classList.add('active');
                };
            }
        });
    });
}


// Function to load messages for a conversation
function loadMessages(convId, pushName, pfpUrl) {
    if (currentConversation === convId) return;

    currentConversation = convId;
    messagesArea.innerHTML = ''; 

    chatHeader.innerHTML = `
        <span class="back-button" id="back-btn">&larr;</span>
        <img src="${pfpUrl}" class="profile-pic" onerror="this.src='https://via.placeholder.com/50'">
        <p>${pushName}</p>
    `;
    document.getElementById('back-btn').onclick = goBack;

    // Unsubscribe from previous listener
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }

    const messagesQuery = query(collection(db, 'conversations', convId, 'messages'), orderBy('timestamp'));

    unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
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
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }
        });
    });
}

// Function to go back to conversation list on mobile
function goBack() {
    container.classList.remove('chat-active');
    currentConversation = null;
    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }
}

// Initial load
loadConversations();
