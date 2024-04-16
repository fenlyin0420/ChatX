from flask import Flask, Response, stream_with_context, request, jsonify, json
from datetime import datetime
import os  
import requests  
import time  
  
app = Flask(__name__)  
  
# 阿里云通义千问API  
API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

body = {
    "model": "qwen-max",
    "input": {
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistent!"
            },
            {
                "role": "user",
                "content": ""
            }
        ]
    },
    "parameters": {
        "enable_search": True
    }
}
headers = {  
    'Authorization': os.environ.get('DASH_SCOPE_KEY'),  
    'Content-Type': 'application/json',
    #'Accept': 'text/event-stream'
}  
  

@app.route('/api/chat', methods=['POST'])  
def sendMessage():  
    data = request.get_json() # type(date) -> dict 

    # 用户消息
    question = data.get('question')  
    with open("access.log", 'a') as f:
        print(f"[{datetime.now().strftime('%Y/%m/%d-%H:%M:%S')}]: {data['question']}", file=f)
        # 调用通义千问API  
        response = requests.post(API_ENDPOINT, headers=headers, json=body)  

    # 检查响应状态并返回  
    if response.status_code == 200:  
        res = response.json()
        res['output']['text'] = res['output']['text'].replace('\n', '<br>')
        res['output']['text'] = res['output']['text'].replace(' ', '&nbsp;')
        print(res['output']['text'])
        return jsonify(res)  
    else:  
        return jsonify({'error': 'Failed to fetch response from API'}), response.status_code  


if __name__ == '__main__':  
    app.run()
