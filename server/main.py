from fastapi import FastAPI, Request
from starlette.responses import StreamingResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
from config import headers, body, API_ENDPOINT
from datetime import datetime
import time

app = FastAPI()
app.mount('/static', StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("index.html")


async def stream_sse(response: httpx.Response):
    async for line in response.aiter_lines():
        if line:
            time.sleep(0.1)
            print(line)
            yield f"data: {line}\n\n"

@app.post("/api/chat")
async def proxy_sse(request: Request):
    data = await request.json()
    body['input']['messages'][1]['content'] = data['message']
    with open('access.log', 'a', encoding='utf-8') as f:
        content = datetime.now().strftime(f"[%Y/%m/%d-%H:%M:%S]:{data['message']}")
        print(content, file=f)
    
    
@app.get('/api/chat')
async def rsp():
    async with httpx.AsyncClient() as client:
        response = await client.post(API_ENDPOINT, headers=headers, json=body, timeout=None)
        print(response.text)
        return StreamingResponse(stream_sse(response), media_type="text/event-stream")

@app.get('test')
def test():
    return "Hello World"

#########################################测试用#########################################
async def iter_file(chunk_size=1024):
    """异步迭代文件内容"""
    for i in range(100):
        time.sleep(1)
        yield f"data: {i}\n\n"

@app.get('/sse')
async def homepage():
    # 假设有一个大文件需要发送给客户端
    return StreamingResponse(iter_file(), media_type='text/event-stream')
