from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.authentication import router as authentication_router

app = FastAPI()

app.include_router(authentication_router.router, prefix="/auth", tags=["auth"])

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],  # Next.js dev server
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
async def read_root():
  return {"message": "root route!!"}

@app.get("/ping")
async def ping():
  return {"message": "pong"}