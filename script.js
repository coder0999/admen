import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, getDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

// Modal elements
const modal = document.getElementById('profile-modal');
const closeModal = document.querySelector('.close-button');
const historyContent = document.getElementById('history-content');


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
                    convList.prepend(convElement);
                }

                convElement.innerHTML = `
                    <img src="${pfpUrl}" alt="Profile" class="profile-pic" onerror="this.src='https://via.placeholder.com/50'">
                    <div class="conversation-details">
                        <p class="conversation-name">${pushName}</p>
                        <p class="last-message">Loading...</p> 
                    </div>
                `;

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
                    loadMessages(convId);
                    container.classList.add('chat-active');
                    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
                    convElement.classList.add('active');
                };
            }
        });
    });
}

// Function to show profile history
async function showProfileHistory(convId) {
    const docRef = doc(db, "conversations", convId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const history = data.profileHistory || [];
        historyContent.innerHTML = ''; // Clear previous history

        if (history.length > 0) {
            // Reverse the array to show newest first
            history.reverse().forEach(record => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const pfp = document.createElement('img');
                pfp.className = 'profile-pic';
                pfp.src = record.pfpUrl || 'https://via.placeholder.com/50';
                pfp.onerror = () => { pfp.src = 'https://via.placeholder.com/50'; };

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'history-details'; // Use a class for further styling

                const name = document.createElement('p');
                name.className = 'history-name';
                name.textContent = record.pushName || 'N/A';

                const date = document.createElement('p');
                date.className = 'history-date';
                date.textContent = record.capturedAt ? new Date(record.capturedAt.seconds * 1000).toLocaleString() : 'Date unknown';

                detailsDiv.appendChild(name);
                detailsDiv.appendChild(date);
                
                item.appendChild(pfp);
                item.appendChild(detailsDiv);
                historyContent.appendChild(item);
            });
        } else {
            historyContent.textContent = 'No profile history found.';
        }
        modal.style.display = 'block';
    } else {
        alert("Could not find conversation data.");
    }
}


// Function to load messages for a conversation
async function loadMessages(convId) {
    if (currentConversation === convId) return;
    
    currentConversation = convId;
    messagesArea.innerHTML = ''; 

    // Fetch latest profile info for the header
    const docRef = doc(db, "conversations", convId);
    const docSnap = await getDoc(docRef);
    let pfpUrl = 'https://via.placeholder.com/50';
    if(docSnap.exists() && docSnap.data().profileHistory.length > 0) {
        pfpUrl = docSnap.data().profileHistory[docSnap.data().profileHistory.length - 1].pfpUrl;
    }

    chatHeader.innerHTML = `
        <img src="${pfpUrl}" id="header-pfp" class="profile-pic" onerror="this.src='https://via.placeholder.com/50'">
    `;
    
    document.getElementById('header-pfp').onclick = () => showProfileHistory(convId);

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

// Close modal events
closeModal.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};


// Initial load
loadConversations();
