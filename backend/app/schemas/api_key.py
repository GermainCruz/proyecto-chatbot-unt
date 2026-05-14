from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ApiKeyBase(BaseModel):
    nombre: str
    clave: str

class ApiKeyCreate(ApiKeyBase):
    pass

class ApiKeyOut(ApiKeyBase):
    model_config = ConfigDict(from_attributes=True)
    
    id_api_key: int
    activa: bool
    creada_en: datetime
