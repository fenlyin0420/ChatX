function addEle(content, cls) {  
    var ele = document.createElement('div');  
    ele.classList.add(cls);  
    ele.innerHTML = content;  
    var messages = document.getElementById("messages");  
    messages.appendChild(ele);  
    messages.scrollTop = messages.scrollHeight;  
}  
  
function startSSE() {  
    var eventSource = new EventSource('/api/chat/stream');  
    eventSource.onmessage = function(event) {  
        var data = JSON.parse(event.data);  
        if ('output' in data && 'text' in data['output']) {  
            addEle(data['output']['text'], 'bot-message');  
        } else if ('error' in data) {  
            addEle('An error occurred: ' + data['error'], 'error-message');  
        }  
    };  
  
    eventSource.onerror = function(error) {  
        if (eventSource.readyState == EventSource.CLOSED) {  
            // 连接被关闭，可以重新连接或显示错误信息  
            console.error('Connection closed unexpectedly');  
        }  
    };  
}  

var chatInput = document.getElementById("chatInput");
var send_button = document.getElementById("send-button");
chatInput.addEventListener('keydown', Event => {
	if (Event.key == 'Enter'){
		send_button.click();
	}	
})
  
  
function sendQuestion() {  
    var chatEle = document.getElementById('chatInput');  
	var sendBut = document.getElementById('send-button');
    var question = chatEle.value;  
	sendBut.disabled = true;
	if (question == ''){
		window.alert("Please input your question");
		sendBut.disabled = false;
		return;
	}
    chatEle.value = '';  
    addEle(question, 'user-message');  
  
    $.ajax({
        url: '/api/chat',  
        type: 'POST',  
        contentType: 'application/json',  
        data: JSON.stringify({ question }), 
		success:function(response){
			let content = response["output"]["text"];
			// console.log(content)
			addEle(content, "bot-message" );
			sendBut.disabled = false;
    }}) 
}  
