from pydantic import BaseModel
from typing import Optional, List, Literal

class ChatRequest(BaseModel):
    path: Literal["news", "trends", "projects", "followup"]
    message: str = ""
    session_id: Optional[str] = None
    model_pref: str = "auto"
    source_pref: List[str] = []

class ChatResponse(BaseModel):
    success: bool
    session_id: str
    path: str
    response: str
    model_used: Optional[str] = None
    timestamp: str
