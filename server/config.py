import os
# 阿里云通义千问API
API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'


body = {
    "model": "qwen-turbo",
    "input":{
        "messages":[      
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content":"写一份冒泡排序"
            }
        ]
    },
    "parameters": {
        "result_format": "message"
    }
}

headers = {
    'Authorization': os.environ.get('DASHSCOPE_API_KEY'),
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'cache-control': 'no-cache'
}