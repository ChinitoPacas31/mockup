from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import flash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.incubadorasDB

usuarios_col = db.usuarios
incubadoras_col = db.incubadoras
aves_col = db.aves
registros_col = db.registros
codigos_col = db.codigos_validos

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
            "id": str(doc["_id"]),
            "codigo": doc["codigo"],
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
            "tipo_ave": ave["nombre"] if ave else "Desconocido"
        })
    return jsonify(incubadoras)

@app.route('/api/incubadoras', methods=['POST'])
def api_add_incubadora():
    data = request.json
    user_id = data.get("user_id")
    ave_id = data.get("ave_id")
    codigo = data.get("codigo")

    if not all([user_id, ave_id, codigo]):
        return jsonify({"success": False, "message": "Datos incompletos"}), 400

    # Validar código
    codigo_valido = codigos_col.find_one({"codigo": codigo, "usado": False})
    if not codigo_valido:
        return jsonify({"success": False, "message": "Código inválido o ya usado"}), 400

    # Insertar incubadora
    incubadoras_col.insert_one({
        "codigo": codigo,
        "nombre": data["nombre"],
        "ubicacion": data["ubicacion"],
        "activa": True,
        "usuario_id": ObjectId(user_id),
        "ave_id": ObjectId(ave_id)
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
            "id": str(doc["_id"]),
            "codigo": doc["codigo"],
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
            "tipo_ave": ave["nombre"] if ave else "Desconocido"
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
        ave_id = data.get("ave_id")
        codigo = data.get("codigo")

        if not ave_id or not codigo:
            return render_template("incubadoras.html", error="Tipo de ave y código son requeridos")

        # Validar código
        codigo_valido = codigos_col.find_one({"codigo": codigo, "usado": False})
        if not codigo_valido:
            # Reenviar con mensaje de error
            user_id = ObjectId(session["user_id"])
            incubadoras = list(incubadoras_col.find({"usuario_id": user_id}))
            aves = list(aves_col.find())
            return render_template("incubadoras.html", error="Código inválido o ya usado", incubadoras=incubadoras, nombre=session.get("user_name"), aves=aves)

        # Insertar incubadora
        incubadoras_col.insert_one({
            "codigo": codigo,
            "nombre": data["nombre"],
            "ubicacion": data["ubicacion"],
            "activa": True,
            "usuario_id": ObjectId(session["user_id"]),
            "ave_id": ObjectId(ave_id)
        })

        codigos_col.update_one({"_id": codigo_valido["_id"]}, {"$set": {"usado": True}})

        # Mostrar mensaje de éxito
        user_id = ObjectId(session["user_id"])
        incubadoras = list(incubadoras_col.find({"usuario_id": user_id}))
        aves = list(aves_col.find())
        return render_template("incubadoras.html", success="Incubadora agregada correctamente", incubadoras=incubadoras, nombre=session.get("user_name"), aves=aves)
    user_id = ObjectId(session["user_id"])
    incubadoras = []
    for doc in incubadoras_col.find({"usuario_id": user_id}):
        ave = aves_col.find_one({"_id": doc.get("ave_id")})
        incubadoras.append({
            "id": str(doc["_id"]),
            "codigo": doc["codigo"],
            "nombre": doc["nombre"],
            "ubicacion": doc["ubicacion"],
            "activa": doc.get("activa", True),
            "tipo_ave": ave["nombre"] if ave else "Desconocido"
        })
    aves = list(aves_col.find())
    return render_template('incubadoras.html', incubadoras=incubadoras, nombre=session.get("user_name"), aves=aves)

@app.route('/incubadora/<id>')
def ver_incubadora(id):
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    incubadora = incubadoras_col.find_one({"_id": ObjectId(id)})
    if not incubadora:
        return "Incubadora no encontrada", 404

    ave = aves_col.find_one({"_id": incubadora.get("ave_id")})
    return render_template('incubadora_detalle.html', incubadora=incubadora, ave=ave)

@app.route('/incubadora/<id>/registros')
def registros_incubadora(id):
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    incubadora = incubadoras_col.find_one({"_id": ObjectId(id)})
    if not incubadora:
        return jsonify({"error": "Incubadora no encontrada"}), 404

    registros_cursor = registros_col.find({"incubadora_id": ObjectId(id)}).sort("fechaHora", 1)

    registros = []
    for r in registros_cursor:
        registros.append({
            "fechaHora": r["fechaHora"].isoformat(),
            "temperatura": r["temperatura"],
            "humedad": r["humedad"]
        })

    return jsonify(registros)

@app.route('/api/aves', methods=['GET'])
def api_get_aves():
    aves = list(aves_col.find({}, {"nombre": 1}))
    return jsonify([{"_id": str(ave["_id"]), "nombre": ave["nombre"]} for ave in aves])

@app.route('/api/incubadora/<incubadora_id>', methods=['GET'])
def api_get_incubadora(incubadora_id):
    incubadora = incubadoras_col.find_one({"_id": ObjectId(incubadora_id)})
    if not incubadora:
        return jsonify({"error": "Incubadora no encontrada"}), 404
    
    ave = aves_col.find_one({"_id": incubadora.get("ave_id")})
    return jsonify({
        "_id": str(incubadora["_id"]),
        "codigo": incubadora["codigo"],
        "nombre": incubadora["nombre"],
        "ubicacion": incubadora["ubicacion"],
        "activa": incubadora.get("activa", True),
        "tipo_ave": ave["nombre"] if ave else "Desconocido"
    })

@app.route('/api/incubadora/<incubadora_id>/registros', methods=['GET'])
def api_get_registros(incubadora_id):
    registros_cursor = registros_col.find({"incubadora_id": ObjectId(incubadora_id)}).sort("fechaHora", 1)
    
    registros = []
    for r in registros_cursor:
        registros.append({
            "fechaHora": r["fechaHora"].isoformat(),
            "temperatura": r["temperatura"],
            "humedad": r["humedad"]
        })
    
    return jsonify(registros)

@app.route('/perfil/registros')
def perfil_registros():
    if "user_id" not in session:
        return jsonify([])

    user_id = ObjectId(session["user_id"])
    # Ejemplo: obtén los últimos registros de todas las incubadoras del usuario
    registros = []
    for inc in incubadoras_col.find({"usuario_id": user_id}):
        for reg in registros_col.find({"incubadora_id": inc["_id"]}).sort("fechaHora", -1).limit(1):
            registros.append({
                "fechaHora": reg["fechaHora"].isoformat(),
                "temperatura": reg.get("temperatura", 0),
                "humedad": reg.get("humedad", 0),
                "incubadora": inc["nombre"]
            })
    # Opcional: ordenar por fecha
    registros.sort(key=lambda r: r["fechaHora"])
    return jsonify(registros)

@app.route('/api/incubadora/<id>/toggle', methods=['POST'])
def toggle_incubadora(id):
    incubadora = incubadoras_col.find_one({"_id": ObjectId(id)})
    if not incubadora:
        return jsonify({"success": False, "message": "Incubadora no encontrada"}), 404

    nueva_activa = not incubadora.get("activa", True)
    incubadoras_col.update_one({"_id": ObjectId(id)}, {"$set": {"activa": nueva_activa}})
    
    return jsonify({"success": True, "activa": nueva_activa})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
