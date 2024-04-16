from fastapi import FastAPI, Response, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import requests
from datetime import datetime

app = FastAPI()

# 阿里云通义千问API
API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

class Message(BaseModel):
    role: str
    content: str

class Input(BaseModel):
    messages: list[Message]

class Parameters(BaseModel):
    enable_search: bool = True

class RequestBody(BaseModel):
    model: str
    input: Input
    parameters: Parameters

body = RequestBody(
    model="qwen-max",
    input=Input(
        messages=[
            Message(role="system", content="You are a helpful assistant!"),
            Message(role="user", content="")
        ]
    ),
    parameters=Parameters(enable_search=True)
)

headers = {
    'Authorization': os.environ.get('DASHSCOPE_API_KEY'),
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
}
app.mount('/static', StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("index.html")


@app.get("/api/conversation")
async def conversation():
    response = requests.post(API_ENDPOINT, headers=headers, json=body.__dict__)
    if response.status_code == 200:
        return Response(response=response.iter_lines(), media_type='text/event-stream', headers={'connection': 'keep-alive'})
    else:
        return Response(content="Error: Failed to fetch response from API", media_type='text/event-stream', status_code=response.status_code)


@app.post("/api/chat")
async def send_message(request: Request):
    data = await request.json()
    question = data.get('question')
    if question:
        new_body = body.dict(exclude_unset=True)
        new_body['input']['messages'][1]['content'] = question
        with open("access.log", 'a') as f:
            timestamp = datetime.now().strftime('%Y/%m/%d-%H:%M:%S')
            log_entry = f"[{timestamp}]: {question}\n"
            f.write(log_entry)
        return Response(status_code=200)
    else:
        return Response(status_code=400)
