from pydantic import BaseModel, Field, conint, ConfigDict
from typing import Dict, List, Optional

class CreditCard(BaseModel):
    name: str = Field(..., min_length=2)
    issuer: Optional[str] = None

class AnalyzeReq(BaseModel):
    model_config = ConfigDict(extra='forbid')
    salary: conint(gt=0)
    spending: Dict[str, float] = Field(default_factory=dict)
    credit_cards: List[CreditCard] = Field(default_factory=list)
    financial_goals: List[str] = Field(default_factory=list)

class SourceDoc(BaseModel):
    title: str
    url: str
    score: float

class Plan(BaseModel):
    budget: Dict[str, float]
    cards: Dict[str, str]
    actions: List[str]
    explain: str

class AnalyzeResp(BaseModel):
    plan: Plan
    sources: List[SourceDoc]
