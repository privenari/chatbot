import os
import re
from datetime import datetime
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

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
    codigo_espacio: str = "AUTO"
    patente_vehiculo: str
    cliente_nombre: str
    fecha_inicio: datetime
    fecha_fin: datetime

    @field_validator("codigo_espacio")
    @classmethod
    def normalizar_codigo(cls, v: str) -> str:
        limpio = v.strip().upper()
        if limpio in {"", "AUTO", "CUALQUIERA", "CUALQUIER", "LIBRE", "NINGUNO"}:
            return "AUTO"
        match = re.search(r"([A-Z])-?(\d{2})", limpio)
        if not match:
            raise ValueError("Indica un código válido (ej. A-01, B-02) o 'AUTO' para asignar cualquiera libre.")
        return f"{match.group(1)}-{match.group(2)}"

    @field_validator("patente_vehiculo")
    @classmethod
    def validar_patente(cls, v: str) -> str:
        limpio = v.strip().upper()
        invalidos = {
            "", "N/A", "NA", "PENDIENTE", "SIN PATENTE", "DESCONOCIDA",
            "XXXX", "ABCD-12", "ABC-123", "XYZ-123", "12345", "123456"
        }
        if len(limpio) < 5 or limpio in invalidos:
            raise ValueError("Falta la patente real del vehículo (mínimo 5 caracteres).")
        return limpio

    @field_validator("cliente_nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        invalidos = {"", "N/A", "CLIENTE", "USUARIO", "PENDIENTE", "NOMBRE"}
        if len(limpio) < 3 or limpio.upper() in invalidos:
            raise ValueError("Falta el nombre completo del cliente.")
        return limpio

    @field_validator("fecha_fin")
    @classmethod
    def validar_horario_real(cls, v: datetime, info) -> datetime:
        inicio = info.data.get("fecha_inicio")
        if inicio:
            if inicio >= v:
                raise ValueError("La fecha y hora de inicio debe ser anterior a la de término.")
            if inicio.hour == 0 and inicio.minute == 0 and v.hour == 23 and v.minute == 59:
                raise ValueError("Falta el horario específico (hora de inicio y hora de término).")
        return v

# 1A. ENDPOINT: Consultar disponibilidad en un rango de fechas
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

# 1B. ENDPOINT: Listar todos los espacios con su estado real en un bloque horario
@app.get("/espacios")
def listar_espacios_estado(inicio: datetime, fin: datetime):
    if inicio >= fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la de fin.")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            e.id,
            e.codigo,
            e.zona,
            e.tipo,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM reservas r
                    WHERE r.espacio_id = e.id
                      AND r.estado = 'confirmada'
                      AND (r.fecha_inicio < %s AND r.fecha_fin > %s)
                ) THEN FALSE
                ELSE TRUE
            END AS disponible
        FROM espacios e
        WHERE e.activo = TRUE
        ORDER BY e.id ASC;
    """, (fin, inicio))

    espacios = cur.fetchall()
    cur.close()
    conn.close()
    return {"espacios": espacios}

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

    if reserva.codigo_espacio == "AUTO":
        cur.execute("""
            SELECT id, codigo FROM espacios
            WHERE activo = TRUE
            AND id NOT IN (
                SELECT espacio_id FROM reservas
                WHERE estado = 'confirmada'
                AND (fecha_inicio < %s AND fecha_fin > %s)
            )
            ORDER BY id ASC
            LIMIT 1;
        """, (reserva.fecha_fin, reserva.fecha_inicio))
        espacio = cur.fetchone()
        if not espacio:
            cur.close()
            conn.close()
            raise HTTPException(status_code=409, detail="No hay ningún espacio disponible en ese horario.")
        espacio_id = espacio["id"]
        codigo_asignado = espacio["codigo"]
    else:
        cur.execute("SELECT id, codigo FROM espacios WHERE codigo = %s AND activo = TRUE;", (reserva.codigo_espacio,))
        espacio = cur.fetchone()
        if not espacio:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail=f"El espacio '{reserva.codigo_espacio}' no existe o está inactivo.")
        espacio_id = espacio["id"]
        codigo_asignado = espacio["codigo"]

        cur.execute("""
            SELECT id FROM reservas
            WHERE espacio_id = %s AND estado = 'confirmada'
            AND (fecha_inicio < %s AND fecha_fin > %s)
        """, (espacio_id, reserva.fecha_fin, reserva.fecha_inicio))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=409, detail=f"El espacio {codigo_asignado} ya está reservado en ese horario.")

    cur.execute("""
        INSERT INTO reservas (espacio_id, patente_vehiculo, cliente_nombre, fecha_inicio, fecha_fin)
        VALUES (%s, %s, %s, %s, %s) RETURNING id, estado;
    """, (espacio_id, reserva.patente_vehiculo.upper(), reserva.cliente_nombre, reserva.fecha_inicio, reserva.fecha_fin))

    nueva_reserva = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        "mensaje": "Reserva confirmada",
        "espacio_asignado": codigo_asignado,
        "reserva": nueva_reserva
    }

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
