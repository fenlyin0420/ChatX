from fastapi import FastAPI, Request
from starlette.responses import StreamingResponse
from datetime import datetime
import os
from openai import OpenAI
import json

app = FastAPI()

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# Default system message
SYSTEM_MESSAGE = "You are a helpful assistant."

async def generate_stream_response(message):
    """Generate streaming response from Qwen model and format as JSON chunks"""
    try:
        completion = client.chat.completions.create(
            model="qwen-turbo-1101",
            messages=[
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": message},
            ],
            stream=True,
        )
        
        for chunk in completion:
            if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                json_chunk = {
                    "choices": [{"delta": {"content": chunk.choices[0].delta.content}}]
                }
                yield f"data: {json.dumps(json_chunk)}\n\n"
        
        yield "data: {\"choices\":[{\"delta\":{\"content\":\"\"}, \"finish_reason\":\"stop\"}]}\n\n"
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        print(f"Error in stream: {str(e)}")
        error_chunk = {
            "error": str(e)
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"

def log_message(message):
    """Log user messages with timestamp"""
    with open('access.log', 'a', encoding='utf-8') as f:
        timestamp = datetime.now().strftime("[%Y/%m/%d-%H:%M:%S]")
        f.write(f"{timestamp}: {message}\n")

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """Combined endpoint that accepts the message and returns streaming response"""
    try:
        data = await request.json()
        user_message = data.get('message', '')
        log_message(user_message)
        
        return StreamingResponse(
            generate_stream_response(user_message),
            media_type="text/event-stream"
        )
    except Exception as e:
        return {"error": str(e)}

@app.get('/health')
def health_check():
    """Simple health check endpoint"""
    return {"status": "ok"}