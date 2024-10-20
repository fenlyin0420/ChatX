var chatInput = document.getElementById("chatInput");
var send_button = document.getElementById("send-button");
var chat_container = document.getElementById("messages")

chatInput.addEventListener('keydown', Event => {
    if (Event.key == 'Enter'){
        send_button.click();
    }   
})

/**
 * 在指定类里添加一个 div 元素
 * @param {string} content 元素里的内容
 * @param {string} cls 元素所属类
 * @returns None
 */
function addEle(content, cls) {  
    var ele = document.createElement('div');  
    ele.classList.add(cls);  
    ele.innerHTML = content;  
    chat_container.appendChild(ele);  
    chat_container.scrollTop = chat_container.scrollHeight;
    return ele;
}  
  
function sendQuestion() {     
    var chatEle = document.getElementById('chatInput');  
    var question = chatEle.value;
    
    send_button.disabled = true;
    if (question == ''){
        window.alert("Please input your question");
        send_button.disabled = false;
        return;
    }
    chatEle.value = '';     
    addEle(question, 'user-message');  
    
    // 发送请求
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: question})
    })
    .then(response => {
        if (response.ok) {
            const eventSource = new EventSource('/api/chat');
            var ele = addEle("", "bot-message")
            ele.innerHTML = "正在思考中...";

            eventSource.onmessage = function(event) {
                console.log(event.data)
                if (event.data.startsWith('data')) {
                    ele.innerHTML = JSON.parse(event.data.slice(5))['output']['choices'][0]['message']['content'].replace(/\n/g, '<br>')
                    chat_container.scrollTop = chat_container.scrollHeight;
                }
            };

            eventSource.onerror = function(event) {
                send_button.disabled = false;
                eventSource.close();
            };
        } else {
            console.error("Failed to send message:", response.statusText);
            send_button.disabled = false;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        send_button.disabled = false;
    });
} 