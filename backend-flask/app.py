from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

mongo_uri = "mongodb+srv://luisAdmin:1234@1stcluster.x5upfob.mongodb.net/?retryWrites=true&w=majority&appName=1stCluster"
client = MongoClient(mongo_uri)
db = client.incubadorasDB

usuarios_col = db.usuarios
incubadoras_col = db.incubadoras
aves_col = db.aves
registros_col = db.registros

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

    if not all([user_id, ave_id]):
        return jsonify({"success": False, "message": "Datos incompletos"}), 400

    incubadoras_col.insert_one({
        "codigo": data["codigo"],
        "nombre": data["nombre"],
        "ubicacion": data["ubicacion"],
        "activa": True,
        "usuario_id": ObjectId(user_id),
        "ave_id": ObjectId(ave_id)
    })

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

@app.route('/incubadoras', methods=['POST'])
def add_incubadora():
    if "user_id" not in session:
        return redirect(url_for('login_form'))

    data = request.form
    ave_id = data.get("ave_id")

    if not ave_id:
        return "Tipo de ave es requerido", 400

    incubadoras_col.insert_one({
        "codigo": data["codigo"],
        "nombre": data["nombre"],
        "ubicacion": data["ubicacion"],
        "activa": True,
        "usuario_id": ObjectId(session["user_id"]),
        "ave_id": ObjectId(ave_id)
    })
    return redirect(url_for('home'))

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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
