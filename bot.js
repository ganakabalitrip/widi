(() => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbot = document.getElementById('chatbot');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const notificationSound = document.getElementById('notification-sound');
    const originalBookingForm = document.getElementById('bookingForm');

    // Quick questions to show below messages
    const quickQuestions = [
        "What tours do you offer?",
        "How do I book?",
        "What are the prices?",
        "Contact information"
    ];

    // Convert current date to Bali time with HH:mm format
    function getBaliTime() {
        // Bali is UTC+8 in JavaScript Intl timezone database: Asia/Makassar
        const baliDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
        return baliDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Load chat history from localStorage
    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('ubudChatHistory') || '[]');
        chatbotMessages.innerHTML = '';
        history.forEach(msg => {
            addMessage(msg.type, msg.text, msg.timestamp, false);
        });
        addQuickQuestionButtons();
        scrollToBottom();
    }

    // Save chat history to localStorage
    function saveChatHistory() {
        const messages = [];
        chatbotMessages.querySelectorAll('.chat-message').forEach(el => {
            messages.push({
                type: el.dataset.type,
                text: el.querySelector('.message-text').innerText,
                timestamp: el.querySelector('.message-time').innerText,
            });
        });
        localStorage.setItem('ubudChatHistory', JSON.stringify(messages));
    }

    // Add message to chat window
    function addMessage(type, text, timestamp = null, playSound = true) {
        const time = timestamp || getBaliTime();
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
        msgEl.dataset.type = type;

        // If bot message has special booking button
        let extraHTML = '';
        if (type === 'bot' && text === '__BOOKING_BUTTON__') {
            extraHTML = `
                <button id="booking-button" class="mt-2 bg-ubud-green text-white px-4 py-1 rounded hover:bg-ubud-green/90 transition">
                    Book Now
                </button>
            `;
            text = 'You can click the button below to open the booking form.';
        }

        msgEl.innerHTML = `
            <div class="max-w-[75%] px-4 py-2 rounded-lg relative text-sm flex gap-2 ${type === 'user' ? 'bg-ubud-green text-white rounded-br-none' : 'bg-white border border-gray-300 rounded-bl-none'} items-end flex-col">
                <div class="flex items-end gap-2 w-full">
                    <img src="${type === 'user' ? 'https://cdn-icons-png.flaticon.com/512/147/147144.png' : 'https://cdn-icons-png.flaticon.com/512/327/327779.png'}" alt="${type}" class="w-6 h-6 rounded-full object-cover">
                    <p class="message-text whitespace-pre-wrap flex-grow">${text}</p>
                    <span class="message-time block text-xs text-gray-500">${time}</span>
                </div>
                ${extraHTML}
            </div>
        `;
        chatbotMessages.appendChild(msgEl);

        if (playSound && type === 'bot') {
            notificationSound.play();
        }

        if (extraHTML) {
            const bookingBtn = document.getElementById('booking-button');
            bookingBtn.addEventListener('click', () => {
                if (typeof openBookingPopup === 'function') {
                    openBookingPopup();
                }
            });
        }

        scrollToBottom();
        saveChatHistory();
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Display quick question buttons below messages
    function addQuickQuestionButtons() {
        // Remove existing quick buttons container
        let existingContainer = document.getElementById('quick-questions');
        if (existingContainer) existingContainer.remove();

        const container = document.createElement('div');
        container.id = 'quick-questions';
        container.className = 'p-2 flex flex-wrap gap-2 border-t border-gray-300 bg-ubud-light';

        quickQuestions.forEach(q => {
            const btn = document.createElement('button');
            btn.textContent = q;
            btn.className = 'bg-ubud-green text-white px-3 py-1 rounded hover:bg-ubud-green/90 transition text-xs flex-grow text-center';
            btn.type = 'button';
            btn.addEventListener('click', () => {
                addMessage('user', q);
                chatbotInput.value = '';
                botReply(q);
            });
            container.appendChild(btn);
        });

        chatbot.appendChild(container);
        // Scroll after adding quick buttons
        scrollToBottom();
    }

    // Remove quick question buttons (call before botReply adds new messages)
    function removeQuickQuestionButtons() {
        const quick = document.getElementById('quick-questions');
        if (quick) quick.remove();
    }

    // Simple bot replies logic
    // Show typing indicator message
function showTypingIndicator() {
    return new Promise(resolve => {
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-message flex justify-start';
        typingEl.dataset.type = 'bot';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = `
            <div class="max-w-[75%] px-4 py-2 rounded-lg relative text-sm bg-white border border-gray-300 rounded-bl-none flex items-center gap-2">
                <img src="https://cdn-icons-png.flaticon.com/512/327/327779.png" alt="bot" class="w-6 h-6 rounded-full object-cover">
                <span class="message-text animate-pulse text-gray-500">Typing...</span>
            </div>
        `;
        chatbotMessages.appendChild(typingEl);
        scrollToBottom();
        setTimeout(() => {
            typingEl.remove();
            resolve();
        }, 1200); // Typing duration (1.2 seconds)
    });
}

// Updated botReply with typing animation
async function botReply(userText) {
    removeQuickQuestionButtons();

    await showTypingIndicator();

    const text = userText.toLowerCase();
    let reply;

    if (text.includes('hello') || text.includes('hi')) {
        reply = "Hello! 👋 How can I help you with your Ubud tour today?";
    } else if (text.includes('tour')) {
        reply = "We have Cultural Heritage, Nature & Wellness, Food & Cooking, and Beach & Sunset tours. Would you like to book one?";
    } else if (text.includes('book') || text.includes('booking')) {
        reply = "__BOOKING_BUTTON__";
    } else if (text.includes('thank')) {
        reply = "You're welcome! If you have any more questions, just ask.";
    } else if (text.includes('price') || text.includes('cost')) {
        reply = "Our prices range from $75 to $120 depending on the tour. Let me know if you want details about a specific tour.";
    } else if (text.includes('contact')) {
        reply = "You can reach us at +62 812 3456 7890 or info@ubudlocaldriver.com.";
    } else if (text.includes('open booking form') || text.includes('open booking')) {
        reply = "Opening the booking form for you now.";
        setTimeout(() => {
            if (typeof openBookingPopup === 'function') {
                openBookingPopup();
            }
        }, 500);
    } else {
        reply = "I'm sorry, I didn't understand that. Could you please rephrase?";
    }

    addMessage('bot', reply);
    addQuickQuestionButtons();
}


    // Handle user form submission
    chatbotForm.addEventListener('submit', e => {
        e.preventDefault();
        const userText = chatbotInput.value.trim();
        if (!userText) return;
        addMessage('user', userText);
        chatbotInput.value = '';
        setTimeout(() => botReply(userText), 800);
    });

    // Toggle chatbot open/close
    chatbotToggle.addEventListener('click', () => {
        chatbot.style.display = 'flex';
        chatbotToggle.style.display = 'none';
        scrollToBottom();
    });
    chatbotClose.addEventListener('click', () => {
        chatbot.style.display = 'none';
        chatbotToggle.style.display = 'flex';
    });

    // Initialize chatbot visibility and load history
    function initChatBot() {
        chatbot.style.display = 'none';
        chatbotToggle.style.display = 'flex';
        loadChatHistory();
    }

    initChatBot();

    // Connect site booking "Book Now" buttons (if any) to open chatbot & booking popup
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === 'book now') {
            btn.addEventListener('click', e => {
                e.preventDefault();
                chatbot.style.display = 'flex';
                chatbotToggle.style.display = 'none';
                addMessage('bot', "Hi! Let's get your tour booked. Please fill the booking form below. You can also use chat here to ask any question.");
                addQuickQuestionButtons();
                scrollToBottom();
                if (typeof openBookingPopup === 'function') {
                    openBookingPopup();
                }
            });
        }
    });

    // Send chat history to Web3Forms on booking form submit
    originalBookingForm.addEventListener('submit', e => {
        e.preventDefault();

        // Gather booking form data
        const formData = new FormData(originalBookingForm);
        let chatHistoryStr = '';
        const history = JSON.parse(localStorage.getItem('ubudChatHistory') || '[]');
        history.forEach(msg => {
            chatHistoryStr += `[${msg.timestamp}] ${msg.type.toUpperCase()}: ${msg.text}\n`;
        });

        formData.append('chat_history', chatHistoryStr);

        // Web3Forms settings - replace with your actual access key
        formData.append('access_key', 'YOUR_WEB3FORMS_ACCESS_KEY');
        formData.append('subject', 'New Booking Request with Chat History');
        formData.append('from_name', formData.get('Full Name') || 'Visitor');
        formData.append('redirect', window.location.href);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData,
        }).then(async res => {
            if (res.ok) {
                alert('Thank you for your booking request! We will contact you shortly.');
                if (typeof closeBookingPopup === 'function') {
                    closeBookingPopup();
                }
                chatbotForm.reset();
                originalBookingForm.reset();
                localStorage.removeItem('ubudChatHistory');
                chatbotMessages.innerHTML = '';
                addQuickQuestionButtons();
            } else {
                alert('There was an error sending your booking request. Please try again later.');
            }
        }).catch(err => {
            alert('Could not submit the form. Please try again later.');
            console.error(err);
        });
    });
})();
