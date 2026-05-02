from fastapi import FastAPI
from dotenv import load_dotenv
from langfuse import Langfuse

load_dotenv(".env.local")

langfuse = Langfuse()

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
