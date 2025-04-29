document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('send-button');
    const chatContainer = document.getElementById('messages');

    // Enable enter key to send messages
    chatInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    // Set click handler for send button
    sendButton.addEventListener('click', sendMessage);

    /**
     * Adds a new message to the chat container
     * @param {string} content - The message content
     * @param {string} className - CSS class for styling (user-message or bot-message)
     * @returns {HTMLDivElement} - The created message element
     */
    function addMessage(content, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add(className);
        messageElement.innerHTML = content;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageElement;
    }

    /**
     * Sends the user message and handles the streaming response
     */
    function sendMessage() {
        const userMessage = chatInput.value.trim();
        
        // Validate input
        if (!userMessage) {
            alert("Please input your question");
            return;
        }
        
        // Disable send button and clear input
        sendButton.disabled = true;
        chatInput.value = '';
        
        // Add user message to chat
        addMessage(userMessage, 'user-message');
        
        // Create bot response placeholder
        const botMessage = addMessage("Thinking...", 'bot-message');
        
        // Send message and get streaming response directly with fetch
        const controller = new AbortController();
        let fullResponse = '';
        
        fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: userMessage }),
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            // Create a reader for the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            // Function to process stream chunks
            function processStream({ done, value }) {
                if (done) {
                    sendButton.disabled = false;
                    return;
                }
                
                // Decode the chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete SSE messages in buffer
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Keep the incomplete part in buffer
                
                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.trim().substring(6); // Remove 'data: ' prefix
                        
                        // Handle stream end
                        if (data === "[DONE]") {
                            sendButton.disabled = false;
                            return;
                        }
                        
                        try {
                            // Parse JSON response
                            const jsonChunk = JSON.parse(data);
                            
                            // Check if there's content in the delta
                            if (jsonChunk.choices && 
                                jsonChunk.choices[0].delta && 
                                jsonChunk.choices[0].delta.content) {
                                
                                const content = jsonChunk.choices[0].delta.content;
                                fullResponse += content;
                                botMessage.innerHTML = formatMessage(fullResponse);
                                chatContainer.scrollTop = chatContainer.scrollHeight;
                            }
                            
                            // Check for finish reason
                            if (jsonChunk.choices && 
                                jsonChunk.choices[0].finish_reason === "stop") {
                                sendButton.disabled = false;
                            }
                        } catch (e) {
                            console.error("Error parsing JSON:", e, data);
                        }
                    }
                }
                
                // Continue reading the stream
                return reader.read().then(processStream);
            }
            
            // Start processing the stream
            return reader.read().then(processStream);
        })
        .catch(error => {
            console.error("Error:", error);
            botMessage.innerHTML = `Error: ${error.message}`;
            sendButton.disabled = false;
        });
    }
    
    /**
     * Format message content for display
     * @param {string} content - Raw message content
     * @returns {string} - Formatted HTML content
     */
    function formatMessage(content) {
        // Replace newlines with <br> for proper HTML display
        return content.replace(/\n/g, '<br>');
    }
});