from flask import Flask
from flask_cors import CORS
from config import init_db, UPLOAD_FOLDER

# Importar Blueprints
from routers.auth import auth_bp
from routers.courses import courses_bp
from routers.schedules import schedules_bp
from routers.academic import academic_bp
from routers.chatbot import chatbot_bp
from routers.plan import plan_bp

app = Flask(__name__)

# Configuración
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config["PROPAGATE_EXCEPTIONS"] = True

# CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Registrar Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(schedules_bp)
app.register_blueprint(academic_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(plan_bp)

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error
    print(f"Unhandled Exception: {e}")
    response = {"error": str(e)}
    return response, 500

# Iniciar Base de Datos
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=8000)
