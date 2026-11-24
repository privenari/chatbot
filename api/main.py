import os
from datetime import datetime
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="API Puente - Estacionamientos", version="1.0.0")

# Función para conectar a la base de datos usando las variables del .env
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="postgres", # Nombre del servicio en docker-compose
            port="5432",
            database=os.getenv("BUSINESS_DB", "estacionamiento_db"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión a DB: {str(e)}")

# Modelo de datos para recibir reservas en formato JSON
class ReservaCreate(BaseModel):
    espacio_id: int
    patente_vehiculo: str
    cliente_nombre: str
    fecha_inicio: datetime
    fecha_fin: datetime

@app.get("/")
def health_check():
    return {"status": "ok", "mensaje": "API de estacionamientos funcionando"}

# 1. ENDPOINT: Consultar disponibilidad en un rango de fechas
@app.get("/disponibilidad")
def consultar_disponibilidad(inicio: datetime, fin: datetime, tipo: Optional[str] = None):
    if inicio >= fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la de fin.")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Busca espacios activos que NO tengan reservas confirmadas solapadas en ese horario
    query = """
        SELECT id, codigo, zona, tipo 
        FROM espacios 
        WHERE activo = TRUE
        AND id NOT IN (
            SELECT espacio_id FROM reservas 
            WHERE estado = 'confirmada'
            AND (fecha_inicio < %s AND fecha_fin > %s)
        )
    """
    params = [fin, inicio]

    if tipo:
        query += " AND tipo = %s"
        params.append(tipo)

    cur.execute(query, tuple(params))
    disponibles = cur.fetchall()

    cur.close()
    conn.close()
    return {"total_disponibles": len(disponibles), "espacios": disponibles}

# 2. ENDPOINT: Crear una nueva reserva
# Modelo de datos actualizado para recibir el código visual (ej. "A-03")
class ReservaCreate(BaseModel):
    codigo_espacio: str
    patente_vehiculo: str
    cliente_nombre: str
    fecha_inicio: datetime
    fecha_fin: datetime

# 2. ENDPOINT: Crear una nueva reserva usando el código del espacio
@app.post("/reservar")
def crear_reserva(reserva: ReservaCreate):
    if reserva.fecha_inicio >= reserva.fecha_fin:
        raise HTTPException(status_code=400, detail="Rango de fechas inválido.")

    conn = get_db_connection()
    cur = conn.cursor()

    # Buscar el ID numérico del espacio a partir de su código (ej. "A-03")
    cur.execute("SELECT id FROM espacios WHERE codigo = %s AND activo = TRUE;", (reserva.codigo_espacio.upper(),))
    espacio = cur.fetchone()
    
    if not espacio:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail=f"El espacio '{reserva.codigo_espacio}' no existe o está inactivo.")
        
    espacio_id = espacio["id"]

    # Verificar que el espacio esté libre en ese horario
    cur.execute("""
        SELECT id FROM reservas 
        WHERE espacio_id = %s AND estado = 'confirmada'
        AND (fecha_inicio < %s AND fecha_fin > %s)
    """, (espacio_id, reserva.fecha_fin, reserva.fecha_inicio))
    
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=409, detail="El espacio ya está reservado en ese horario.")

    # Insertar la reserva
    cur.execute("""
        INSERT INTO reservas (espacio_id, patente_vehiculo, cliente_nombre, fecha_inicio, fecha_fin)
        VALUES (%s, %s, %s, %s, %s) RETURNING id, estado;
    """, (espacio_id, reserva.patente_vehiculo.upper(), reserva.cliente_nombre, reserva.fecha_inicio, reserva.fecha_fin))
    
    nueva_reserva = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {"mensaje": "Reserva confirmada", "reserva": nueva_reserva}

# 3. ENDPOINT: Cancelar una reserva
@app.delete("/cancelar/{reserva_id}")
def cancelar_reserva(reserva_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("UPDATE reservas SET estado = 'cancelada' WHERE id = %s RETURNING id, estado;", (reserva_id,))
    actualizada = cur.fetchone()

    if not actualizada:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    conn.commit()
    cur.close()
    conn.close()
    return {"mensaje": "Reserva cancelada exitosamente", "reserva": actualizada}
