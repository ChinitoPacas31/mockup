from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from datetime import datetime, timezone
from werkzeug.utils import secure_filename
from flask import flash
from dotenv import load_dotenv
from flask import Response
import csv
import io
from PIL import Image
import pillow_heif
import json 
from flask import make_response
from flask import send_file
import pandas as pd
from io import BytesIO

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'heic'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.incubadorasDB

db.incubadoras.create_index("codigo", unique=True)

usuarios_col = db.usuarios
incubadoras_col = db.incubadoras
aves_col = db.aves
registros_col = db.registros
codigos_col = db.codigos_validos

# --- Ruta para mandar los datos a la base --- 
@app.route("/api/datos", methods=["POST"])
def recibir_datos():
    try:
        data = request.json
        temperatura = data.get("temperatura")
        humedad = data.get("humedad")
        codigo_incubadora = data.get("codigo_incubadora")  # Cambiado a código

        # Validación de datos
        if None in (temperatura, humedad, codigo_incubadora):
            return jsonify({
                "error": "Datos incompletos",
                "detalle": "Se requieren temperatura, humedad y código de incubadora"
            }), 400

        # Buscar incubadora por código
        incubadora = incubadoras_col.find_one({"codigo": codigo_incubadora})
        if not incubadora:
            return jsonify({
                "error": "Incubadora no encontrada",
                "detalle": f"No existe incubadora con código {codigo_incubadora}"
            }), 404

        # Crear registro usando el ObjectId interno pero referencia por código
        registro = {
            "fecha": datetime.now(),
            "temperatura": float(temperatura),
            "humedad": float(humedad),
            "incubadora_id": incubadora["_id"],  # Referencia interna
            "codigo_incubadora": codigo_incubadora  # Para fácil consulta
        }

        # Insertar en MongoDB
        result = registros_col.insert_one(registro)
        return jsonify({
            "status": "ok",
            "id": str(result.inserted_id)
        }), 201

    except ValueError as e:
        return jsonify({
            "error": "Error de formato",
            "detalle": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "error": "Error interno",
            "detalle": str(e)
        }), 500

@app.route('/api/control', methods=['POST'])
def api_control():
    try:
        data = request.json
        codigo_incubadora = data.get("codigo_incubadora")  # Cambiado a código
        
        if not codigo_incubadora:
            return jsonify({"error": "Código de incubadora requerido"}), 400
        
        incubadora = incubadoras_col.find_one({"codigo": codigo_incubadora})
        
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404
        
        response_data = {
            "activa": incubadora.get("activa", False),
            "humedad_ideal": incubadora.get("humedad_ideal", 55),
            "temperatura_ideal": incubadora.get("temperatura_ideal", 37.5)
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

# --- RUTAS API PARA APP MOVIL ---

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    print("Datos recibidos en login:", data)  # <-- DEBUG
    email = data.get('email')
    password = data.get('password')

    user = usuarios_col.find_one({"email": email})

    if user and user.get("password") == password:
        return jsonify({
            "success": True,
            "user_id": str(user["_id"]),
            "nombre": user["nombre"]
        })

    return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401


@app.route('/api/registro', methods=['POST'])
def api_registro():
    data = request.json
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')

    if usuarios_col.find_one({"email": email}):
        return jsonify({"success": False, "message": "El email ya está registrado"}), 400

    usuarios_col.insert_one({
        "nombre": nombre,
        "email": email,
        "password": password,
        "rol": "cliente"
    })

    return jsonify({"success": True, "message": "Usuario registrado con éxito"})

@app.route('/api/incubadoras/<user_id>', methods=['GET'])
def api_list_incubadoras(user_id):
    incubadoras = []
    for doc in incubadoras_col.find({"usuario_id": ObjectId(user_id)}):
        ave = aves_col.find_one({"_id": doc.get("ave_id")})
        incubadoras.append({
            "codigo": doc["codigo"],  # Ahora código es el identificador principal
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
            "tipo_ave": ave["nombre"] if ave else "Desconocido",
            "object_id": str(doc["_id"])  # Opcional: mantener referencia
        })
    return jsonify(incubadoras)

@app.route('/api/incubadoras', methods=['POST'])
def api_add_incubadora():
    data = request.json
    user_id = data.get("user_id")
    codigo = data.get("codigo")

    if not all([user_id, codigo]):
        return jsonify({"success": False, "message": "Datos incompletos"}), 400

    # Validar código
    codigo_valido = codigos_col.find_one({"codigo": codigo, "usado": False})
    if not codigo_valido:
        return jsonify({"success": False, "message": "Código inválido o ya usado"}), 400

    # Insertar incubadora sin ave_id
    incubadoras_col.insert_one({
        "codigo": codigo,
        "nombre": data.get("nombre", ""),
        "ubicacion": data.get("ubicacion", ""),
        "activa": False,
        "inicio_activacion": None,
        "usuario_id": ObjectId(user_id),
        "ave_id": None
    })

    # Marcar código como usado
    codigos_col.update_one({"_id": codigo_valido["_id"]}, {"$set": {"usado": True}})

    return jsonify({"success": True, "message": "Incubadora agregada"})

# --- RUTAS WEB ---

@app.route('/')
def home():
    if "user_id" not in session:
        return render_template('index.html')
    user_id = ObjectId(session["user_id"])
    incubadoras = []
    for doc in incubadoras_col.find({"usuario_id": user_id}):
        ave = aves_col.find_one({"_id": doc.get("ave_id")})
        incubadoras.append({
            "codigo": doc["codigo"],  # Usar código como identificador
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
            "tipo_ave": ave["nombre"] if ave else "Desconocido",
            "object_id": str(doc["_id"])  # Mantener para compatibilidad
        })
    aves = list(aves_col.find())
    return render_template('incubadoras.html', incubadoras=incubadoras, nombre=session.get("user_name"), aves=aves)

@app.route('/login', methods=['GET', 'POST'])
def login_form():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = usuarios_col.find_one({"email": email})
        if user and user.get("password") == password:
            session["user_id"] = str(user["_id"])
            session["user_name"] = user["nombre"]
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error="Credenciales incorrectas")
    return render_template('login.html')


@app.route('/perfil')
def perfil():
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    user = usuarios_col.find_one({"_id": ObjectId(session["user_id"])})
    imagen_perfil = user.get("imagen_perfil", None)  # Ruta de la imagen o None

    incubadoras = list(incubadoras_col.find({"usuario_id": ObjectId(session["user_id"])}))
    total_incubadoras = len(incubadoras)
    activas = sum(1 for i in incubadoras if i.get("activa", True))
    inactivas = total_incubadoras - activas

    # Ejemplo para fechas y última incubadora, ajusta según tu DB
    ultima_incubadora = incubadoras[-1].get('nombre', 'N/A') if incubadoras else 'N/A'
    fecha_registro = user.get('fecha_registro', 'N/A')

    return render_template(
        'perfil.html',
        nombre=user["nombre"],
        email=user["email"],
        total_incubadoras=total_incubadoras,
        incubadoras_activas=activas,
        incubadoras_inactivas=inactivas,
        imagen_perfil=imagen_perfil,
        ultima_incubadora=ultima_incubadora,
        fecha_registro=fecha_registro
    )

@app.route('/perfil/editar', methods=['GET', 'POST'])
def editar_perfil():
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    user = usuarios_col.find_one({"_id": ObjectId(session["user_id"])})

    if request.method == 'POST':
        nuevo_nombre = request.form.get('nombre')
        nuevo_email = request.form.get('email')
        nueva_password = request.form.get('password')

        if not nuevo_nombre or not nuevo_email or not nueva_password:
            flash("Todos los campos son obligatorios", "danger")
            return render_template('editar_perfil.html', user=user)

        usuarios_col.update_one(
            {"_id": ObjectId(session["user_id"])},
            {"$set": {
                "nombre": nuevo_nombre,
                "email": nuevo_email,
                "password": nueva_password
            }}
        )
        flash("Perfil actualizado correctamente", "success")
        return redirect(url_for('perfil'))  # <--- Aquí está el cambio

    return render_template('editar_perfil.html', user=user)

@app.route('/perfil/imagen', methods=['GET', 'POST'])
def cambiar_imagen():
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    user = usuarios_col.find_one({"_id": ObjectId(session["user_id"])})

    if request.method == 'POST':
        print("Solicitud POST recibida")

        if 'imagen' not in request.files:
            print("⚠ No se recibió archivo")
            flash('No se seleccionó ningún archivo', 'danger')
            return redirect(request.url)
        
        archivo = request.files['imagen']
        print(f"Nombre recibido: {archivo.filename}")

        if archivo.filename == '':
            print("⚠ Nombre de archivo vacío")
            flash('Nombre de archivo vacío', 'danger')
            return redirect(request.url)

        if archivo and allowed_file(archivo.filename):
            print("✅ Archivo válido")

            filename = secure_filename(archivo.filename)
            # Limpia nombre para evitar espacios y paréntesis
            filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
            # Agrega user_id para evitar colisiones
            filename = f"{session['user_id']}_{filename}"

            ruta_completa = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print(f"Intentando guardar en: {ruta_completa}")

            try:
                archivo.save(ruta_completa)
                print("✅ Archivo guardado correctamente")
            except Exception as e:
                print("❌ Error al guardar el archivo:", e)
                flash("Ocurrió un error al guardar la imagen", "danger")
                return redirect(request.url)

            ruta_relativa = f"/static/uploads/{filename}"
            print(f"Ruta guardada en DB: {ruta_relativa}")

            usuarios_col.update_one(
                {"_id": ObjectId(session["user_id"])},
                {"$set": {"imagen_perfil": ruta_relativa}}
            )

            flash("Imagen de perfil actualizada", "success")
            return redirect(url_for('perfil'))
        else:
            print("⚠ Formato no permitido")
            flash("Formato de imagen no permitido", "danger")

    return render_template('cambiar_imagen.html', user=user)

@app.route('/registro', methods=['GET', 'POST'])
def registro_form():
    if request.method == 'POST':
        nombre = request.form['nombre']
        email = request.form['email']
        password = request.form['password']
        existing_user = usuarios_col.find_one({"email": email})
        if existing_user:
            return render_template('registro.html', error="El email ya está registrado")
        usuarios_col.insert_one({
            "nombre": nombre,
            "email": email,
            "password": password,
            "rol": "cliente"
        })
        return redirect(url_for('login_form'))
    return render_template('registro.html')

@app.route('/logout')
def logout():
    session.clear()
    return render_template('index.html')

@app.route('/incubadoras', methods=['GET', 'POST'])
def incubadoras():
    if request.method == 'POST':
        data = request.form
        codigo = data.get("codigo")

        if not codigo:
            user_id = ObjectId(session["user_id"])
            incubadoras = []
            for doc in incubadoras_col.find({"usuario_id": user_id}):
                incubadoras.append({
                    "codigo": doc["codigo"],
                    "nombre": doc["nombre"],
                    "ubicacion": doc["ubicacion"],
                    "activa": doc.get("activa", True),
                })
            return render_template("incubadoras.html", error="Código es requerido", incubadoras=incubadoras, nombre=session.get("user_name"))

        codigo_valido = codigos_col.find_one({"codigo": codigo, "usado": False})
        if not codigo_valido:
            user_id = ObjectId(session["user_id"])
            incubadoras = []
            for doc in incubadoras_col.find({"usuario_id": user_id}):
                incubadoras.append({
                    "codigo": doc["codigo"],
                    "nombre": doc["nombre"],
                    "ubicacion": doc["ubicacion"],
                    "activa": doc.get("activa", True),
                })
            return render_template("incubadoras.html", error="Código inválido o ya usado", incubadoras=incubadoras, nombre=session.get("user_name"))

        incubadoras_col.insert_one({
            "codigo": codigo,
            "nombre": data["nombre"],
            "ubicacion": data["ubicacion"],
            "activa": False,
            "inicio_activacion": None,
            "usuario_id": ObjectId(session["user_id"]),
        })

        codigos_col.update_one({"_id": codigo_valido["_id"]}, {"$set": {"usado": True}})
        return redirect(url_for('incubadoras'))
    
    # GET
    user_id = ObjectId(session["user_id"])
    incubadoras = []
    for doc in incubadoras_col.find({"usuario_id": user_id}):
        incubadoras.append({
            "codigo": doc["codigo"],
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
        })
    return render_template('incubadoras.html', incubadoras=incubadoras, nombre=session.get("user_name"))

@app.route('/api/incubadora-detalle/<codigo>', methods=['GET'])
def get_incubadora_detalle(codigo):
    try:
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404
        
        ave = None
        dias_transcurridos = 0
        finalizado = False
        
        if incubadora.get("ave_id"):
            ave = aves_col.find_one({"_id": incubadora["ave_id"]})
            
            if incubadora.get("activa") and incubadora.get("inicio_activacion"):
                ahora_utc = datetime.now(timezone.utc)
                inicio_utc = incubadora["inicio_activacion"].astimezone(timezone.utc)
                dias_transcurridos = (ahora_utc - inicio_utc).days
                
                if ave and dias_transcurridos >= ave.get("dias_incubacion", 0):
                    finalizado = True
                    incubadoras_col.update_one(
                        {"codigo": codigo},
                        {"$set": {"activa": False}}
                    )
                    incubadora["activa"] = False

        return jsonify({
            "success": True,
            "incubadora": {
                "codigo": incubadora["codigo"],
                "nombre": incubadora["nombre"],
                "ubicacion": incubadora["ubicacion"],
                "activa": incubadora.get("activa", False),
                "inicio_activacion": incubadora.get("inicio_activacion"),
                "usuario_id": str(incubadora["usuario_id"]),
                "ave_id": str(incubadora.get("ave_id")) if incubadora.get("ave_id") else None
            },
            "ave": {
                "_id": str(ave["_id"]) if ave else None,
                "nombre": ave["nombre"] if ave else None,
                "dias_incubacion": ave.get("dias_incubacion") if ave else None,
                "temperatura_ideal": ave.get("temperatura_ideal") if ave else None,
                "humedad_ideal": ave.get("humedad_ideal") if ave else None
            } if ave else None,
            "dias_transcurridos": dias_transcurridos,
            "finalizado": finalizado
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/incubadora/<codigo>')
def ver_incubadora(codigo):
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    incubadora = incubadoras_col.find_one({"codigo": codigo})
    if not incubadora:
        return "Incubadora no encontrada", 404

    ave = aves_col.find_one({"_id": incubadora.get("ave_id")})
    aves = list(aves_col.find())

    dias_transcurridos = 0
    finalizado = False
    inicio = incubadora.get("inicio_activacion")

    if incubadora.get("activa") and inicio:
        ahora_utc = datetime.now(timezone.utc).date()
        inicio_utc = inicio.astimezone(timezone.utc).date()
        dias_transcurridos = (ahora_utc - inicio_utc).days
        finalizado = dias_transcurridos >= ave["dias_incubacion"] if ave else False

        if finalizado:
            incubadoras_col.update_one(
                {"codigo": codigo},
                {"$set": {"activa": False}}
            )
            incubadora["activa"] = False

    return render_template(
        "incubadora_detalle.html",
        incubadora=incubadora,
        ave=ave,
        aves=aves,
        dias_transcurridos=dias_transcurridos,
        finalizado=finalizado
    )


@app.route('/incubadora/<codigo>/registros')
def registros_incubadora(codigo):
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    try:
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404

        registros_cursor = registros_col.find({"codigo_incubadora": codigo}).sort("fecha", 1)

        registros = []
        for r in registros_cursor:
            registros.append({
                "fecha": r["fecha"].isoformat() if "fecha" in r else None,
                "temperatura": r["temperatura"],
                "humedad": r["humedad"]
            })

        return jsonify(registros)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/aves', methods=['GET'])
def api_get_aves():
    try:
        aves = list(aves_col.find({}))
        return jsonify([{
            "_id": str(ave["_id"]),
            "nombre": ave["nombre"],
            "dias_incubacion": ave.get("dias_incubacion", 0),
            "temperatura_ideal": ave.get("temperatura_ideal", 37.5),
            "humedad_ideal": ave.get("humedad_ideal", 55)
        } for ave in aves])
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/incubadora/<codigo>', methods=['GET'])
def api_get_incubadora(codigo):
    try:
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404
        
        # Convertir ObjectId a string para serialización JSON
        ave_id = str(incubadora["ave_id"]) if "ave_id" in incubadora else None
        
        return jsonify({
            "codigo": incubadora["codigo"],
            "nombre": incubadora.get("nombre", ""),
            "ubicacion": incubadora.get("ubicacion", ""),
            "activa": incubadora.get("activa", False),
            "ave_id": ave_id,
            "inicio_activacion": incubadora.get("inicio_activacion", ""),
            # Agrega otros campos necesarios
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 

@app.route('/api/incubadora/<codigo>/iniciar-ciclo', methods=['POST'])
def iniciar_ciclo_incubadora(codigo):
    try:
        data = request.get_json()
        ave_id = data.get('ave_id')
        
        if not ave_id:
            return jsonify({"error": "Se requiere el ID del ave"}), 400
        
        # Verificar que el ave existe
        ave = aves_col.find_one({"_id": ObjectId(ave_id)})
        if not ave:
            return jsonify({"error": "Ave no encontrada"}), 404
        
        # Actualizar la incubadora
        result = incubadoras_col.update_one(
            {"codigo": codigo},
            {"$set": {
                "activa": True,
                "ave_id": ObjectId(ave_id),
                "inicio_activacion": datetime.now(),
                "ultima_actualizacion": datetime.now()
            }}
        )
        
        if result.modified_count == 1:
            return jsonify({
                "success": True,
                "message": "Ciclo iniciado correctamente"
            })
        else:
            return jsonify({"error": "No se pudo iniciar el ciclo"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incubadora/<codigo>/registros', methods=['GET'])
def api_get_registros(codigo):
    try:
        # Primero encontrar la incubadora por su código para obtener su ObjectId
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404

        # Obtener registros usando el ObjectId de la incubadora
        registros_cursor = registros_col.find({"incubadora_id": incubadora["_id"]}).sort("fecha", 1)
        
        registros = []
        for r in registros_cursor:
            # Manejar casos donde el campo fecha podría no existir o tener diferente nombre
            fecha = r.get("fecha") or r.get("fechaHora") or datetime.now()
            
            registro = {
                "fecha": fecha.isoformat() if hasattr(fecha, 'isoformat') else fecha,
                "temperatura": r.get("temperatura", 0),
                "humedad": r.get("humedad", 0)
            }
            registros.append(registro)
        
        return jsonify(registros)

    except Exception as e:
        print(f"Error al obtener registros: {str(e)}")
        return jsonify({
            "error": "Error al obtener registros",
            "detalle": str(e)
        }), 500

@app.route('/perfil/registros')
def perfil_registros():
    if "user_id" not in session:
        return jsonify([])

    user_id = ObjectId(session["user_id"])
    # Ejemplo: obtén los últimos registros de todas las incubadoras del usuario
    registros = []
    for inc in incubadoras_col.find({"usuario_id": user_id}):
        for reg in registros_col.find({"incubadora_id": inc["_id"]}).sort("fecha", -1).limit(1):
            registros.append({
                "fecha": reg["fecha"].isoformat(),
                "temperatura": reg.get("temperatura", 0),
                "humedad": reg.get("humedad", 0),
                "incubadora": inc["nombre"]
            })
    # Opcional: ordenar por fecha
    registros.sort(key=lambda r: r["fecha"])
    return jsonify(registros)

# @app.route('/api/incubadora/<codigo>/toggle', methods=['POST'])
# def toggle_incubadora(codigo):
#     incubadora = incubadoras_col.find_one({"codigo": codigo})
#     if not incubadora:
#         return jsonify({"success": False, "message": "Incubadora no encontrada"}), 404

#     nueva_activa = not incubadora.get("activa", False)

#     actualizacion = {"activa": nueva_activa}
#     if nueva_activa:
#         actualizacion["inicio_activacion"] = datetime.now()
#     else:
#         actualizacion["inicio_activacion"] = None

#     incubadoras_col.update_one({"codigo": codigo}, {"$set": actualizacion})
    
#     return jsonify({"success": True, "activa": nueva_activa})

@app.route('/api/incubadora/<codigo>/asignar-ave', methods=['POST'])
def asignar_ave(codigo):
    data = request.get_json()
    ave_id = data.get('ave_id')

    incubadora = incubadoras_col.find_one({'codigo': codigo})
    if not incubadora:
        return jsonify({'success': False, 'message': 'Incubadora no encontrada'}), 404

    ave = aves_col.find_one({'_id': ObjectId(ave_id)})
    if not ave:
        return jsonify({'success': False, 'message': 'Ave no encontrada'}), 404

    incubadoras_col.update_one(
        {'codigo': codigo},
        {
            '$set': {
                'ave_id': ave['_id'],
                'activa': True,
                'inicio_activacion': datetime.now()
            }
        }
    )

    return jsonify({
        'success': True,
        'nombre_ave': ave['nombre'],
        'dias_incubacion': ave['dias_incubacion'],
        'temperatura': ave.get('temperatura_ideal', ''),
        'humedad': ave.get('humedad_ideal', ''),
        'inicio_activacion': datetime.now().isoformat()
    })

@app.route('/api/incubadora/<codigo>/apagar', methods=['POST'])
def offIncubadora(codigo):
    try:
        # Verificar que la incubadora existe
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404
            
        if not incubadora.get("activa", False):
            return jsonify({"error": "La incubadora ya está apagada"}), 400
        
        # Actualizar la incubadora (apagar y resetear ave_id)
        result = incubadoras_col.update_one(
            {"codigo": codigo},
            {"$set": {
                "activa": False,
                "ave_id": None,  # Esto asegura que el tipo de ave se resetee
                "inicio_activacion": None,
                "ultima_actualizacion": datetime.now()
            }}
        )
        
        if result.modified_count == 1:
            return jsonify({
                "success": True,
                "message": "Incubadora apagada correctamente"
            })
        else:
            return jsonify({"error": "No se pudo apagar la incubadora"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/apagar-incubadora/<codigo>", methods=["POST"])
def apagar_incubadora(codigo):
    # Verificar si el usuario está autenticado
    if "user_id" not in session:
        return jsonify({"error": "No autorizado: usuario no autenticado"}), 401
    
    try:
        user_id = ObjectId(session["user_id"])
        # Buscar incubadora por código y que pertenezca al usuario
        incubadora = incubadoras_col.find_one({
            "codigo": codigo,
            "usuario_id": user_id
        })
        
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada o no pertenece al usuario"}), 404

        # Actualizar estado usando el código
        result = incubadoras_col.update_one(
            {"codigo": codigo},
            {"$set": {
                "activa": False,
                "inicio_activacion": None,
                "ave_id": None
            }}
        )
        
        if result.modified_count == 1:
            return jsonify({"message": "Incubadora apagada correctamente"}), 200
        else:
            return jsonify({"error": "No se pudo actualizar la incubadora"}), 500
            
    except Exception as e:
        print(f"Error al apagar incubadora: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route('/exportar-registros/<codigo>')
def exportar_registros(codigo):
    incubadora = incubadoras_col.find_one({"codigo": codigo})
    if not incubadora:
        return "Incubadora no encontrada", 404

    registros_cursor = registros_col.find({"codigo_incubadora": codigo}).sort("fecha", 1)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Fecha y Hora', 'Temperatura (°C)', 'Humedad (%)'])

    for r in registros_cursor:
        writer.writerow([
            r.get("fecha").strftime('%Y-%m-%d %H:%M:%S') if r.get("fecha") else '',
            r.get("temperatura", ''),
            r.get("humedad", '')
        ])

    output.seek(0)
    filename = f"registros_{incubadora['nombre'].replace(' ', '_')}.csv"

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )

@app.route('/api/perfil/<user_id>', methods=['GET'])
def api_get_perfil(user_id):
    user = usuarios_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

    return jsonify({
        "success": True,
        "nombre": user.get("nombre"),
        "email": user.get("email"),
        "imagen_perfil": user.get("imagen_perfil", None)
    })

@app.route('/api/perfil/<user_id>', methods=['PUT'])
def api_editar_perfil(user_id):
    data = request.json
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")

    if not all([nombre, email, password]):
        return jsonify({"success": False, "message": "Faltan campos"}), 400

    usuarios_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "nombre": nombre,
            "email": email,
            "password": password
        }}
    )
    return jsonify({"success": True, "message": "Perfil actualizado"})

@app.route('/api/perfil/<user_id>/imagen', methods=['POST'])
def api_cambiar_imagen_perfil(user_id):
    if 'imagen' not in request.files:
        return jsonify({"success": False, "message": "No se envió imagen"}), 400

    archivo = request.files['imagen']

    if archivo.filename == '':
        return jsonify({"success": False, "message": "Archivo sin nombre"}), 400

    ext = archivo.filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "message": "Formato no permitido"}), 400

    filename_base = secure_filename(archivo.filename).rsplit('.', 1)[0].replace(" ", "_")
    filename = f"{user_id}_{filename_base}"

    # Ruta para guardar temporalmente
    ruta_temporal = os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}.{ext}")

    try:
        archivo.save(ruta_temporal)
    except Exception as e:
        return jsonify({"success": False, "message": f"Error al guardar: {e}"}), 500

    # Si es HEIC, convierte a JPG
    if ext == 'heic':
        try:
            heif_file = pillow_heif.read_heif(ruta_temporal)
            image = Image.frombytes(
                heif_file.mode,
                heif_file.size,
                heif_file.data,
                "raw"
            )
            filename_jpg = f"{filename}.jpg"
            ruta_jpg = os.path.join(app.config['UPLOAD_FOLDER'], filename_jpg)
            image.save(ruta_jpg, "JPEG")
            os.remove(ruta_temporal)  # Borra el archivo HEIC original
            ruta_relativa = f"/static/uploads/{filename_jpg}"
        except Exception as e:
            return jsonify({"success": False, "message": f"Error al convertir HEIC a JPG: {e}"}), 500
    else:
        # Si no es HEIC, usa el archivo guardado
        ruta_relativa = f"/static/uploads/{filename}.{ext}"

    usuarios_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"imagen_perfil": ruta_relativa}}
    )

    return jsonify({"success": True, "imagen_perfil": ruta_relativa})

@app.route('/api/incubadora/<codigo>/limpiar-registros', methods=['POST'])
def limpiar_registros_incubadora(codigo):
    try:
        # Verificar que la incubadora existe
        incubadora = incubadoras_col.find_one({"codigo": codigo})
        if not incubadora:
            return jsonify({"error": "Incubadora no encontrada"}), 404

        # Eliminar todos los registros de esta incubadora
        registros_col.delete_many({"codigo_incubadora": codigo})

        # Resetear el tipo de ave
        incubadoras_col.update_one(
            {"codigo": codigo},
            {"$set": {
                "ave_id": None,
                "inicio_activacion": None,
                "ultima_actualizacion": datetime.now()
            }}
        )

        return jsonify({"success": True, "message": "Registros eliminados y ave resetada"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incubadora/<codigo>/exportar-registros', methods=['GET'])
def exportRegistros(codigo):
    try:
        # Obtener todos los registros de la incubadora
        registros = list(registros_col.find({"codigo_incubadora": codigo}).sort("fecha", 1))

        if not registros:
            return jsonify({"error": "No hay registros para exportar"}), 404

        # Crear contenido CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escribir encabezados
        writer.writerow(["Fecha", "Hora", "Temperatura (°C)", "Humedad (%)"])
        
        # Escribir datos
        for registro in registros:
            fecha = registro["fecha"].strftime("%Y-%m-%d")
            hora = registro["fecha"].strftime("%H:%M:%S")
            writer.writerow([
                fecha,
                hora,
                registro["temperatura"],
                registro["humedad"]
            ])
        
        # Preparar respuesta
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = f"attachment; filename=registros_{codigo}.csv"
        response.headers["Content-type"] = "text/csv"
        
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
