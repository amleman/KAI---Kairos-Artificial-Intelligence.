import re
import json
import pandas as pd
import numpy as np
import glob
import os
from difflib import get_close_matches
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Opcional: NLTK para procesamiento avanzado
try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    # Descargar recursos si no existen
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
        nltk.download('stopwords')
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False


class ChatbotAcademico:
    """
    Chatbot académico basado en intents que NO requiere APIs externas.
    Funciona con procesamiento de lenguaje natural local y base de conocimientos.
    """
    
    def __init__(self, path_pensum='./Data/pensum_sistemas.csv'):
        # Cargar TODOS los pensums disponibles
        self.pensums = {}
        self._cargar_todos_los_pensums()
        
        # Por defecto usamos Sistemas como fallback
        self.cursos_info = self.pensums.get('sistemas', {})
        if not self.cursos_info and self.pensums:
            # Si no hay sistemas, usar el primero que haya
            self.cursos_info = list(self.pensums.values())[0]

        # Stopwords en español
        
        # Stopwords en español
        if NLTK_AVAILABLE:
            self.stopwords = set(stopwords.words('spanish'))
        else:
            self.stopwords = {'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'un', 'por', 'con', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'más', 'o', 'pero', 'sus', 'le', 'ya', 'ha', 'me', 'si', 'sin', 'sobre', 'este', 'ser', 'tiene', 'todo', 'también', 'fue', 'hay', 'puede', 'son', 'está', 'entre', 'cuando'}
        
        # Base de intents (intenciones del usuario)
        self.intents = self._cargar_intents()
        
        # Vectorizador para similitud de texto
        self.vectorizer = TfidfVectorizer()
        self._entrenar_vectorizador()
    
    def _cargar_intents(self):
        """Define las intenciones que el chatbot puede reconocer."""
        return {
            'saludo': {
                'patterns': [
                    'hola', 'buenos días', 'buenas tardes', 'buenas noches',
                    'hey', 'qué tal', 'saludos', 'hola bot', 'hi'
                ],
                'responses': [
                    '👋 ¡Hola! Soy tu asistente académico de KAI. ¿En qué puedo ayudarte?',
                    '😊 ¡Bienvenido! Puedo ayudarte con información sobre cursos, prerrequisitos y más. ¿Qué necesitas?',
                    '🎓 ¡Hola! Estoy aquí para resolver tus dudas académicas. ¿Qué deseas consultar?'
                ]
            },
            'despedida': {
                'patterns': [
                    'adiós', 'adios', 'chao', 'hasta luego', 'nos vemos',
                    'bye', 'gracias adiós', 'hasta pronto', 'me voy'
                ],
                'responses': [
                    '👋 Hasta luego. ¡Que tengas un excelente día de estudios! 📚',
                    '😊 Adiós. Recuerda que siempre puedes consultarme cuando lo necesites.',
                    '🎓 Nos vemos. ¡Éxito en tus clases! 🌟'
                ]
            },
            'agradecimiento': {
                'patterns': [
                    'gracias', 'muchas gracias', 'te agradezco', 'perfecto gracias',
                    'thanks', 'ok gracias', 'excelente gracias'
                ],
                'responses': [
                    '😊 ¡De nada! Estoy para ayudarte.',
                    '✨ Con gusto. Si tienes más dudas, aquí estaré.',
                    '💙 Encantado de ayudar. ¿Algo más que necesites?'
                ]
            },
            'prerrequisitos': {
                'patterns': [
                    'qué prerrequisitos tiene', 'prerrequisitos de', 'qué necesito para llevar',
                    'requisitos para', 'pre requisitos', 'que llevo antes de',
                    'qué cursos debo aprobar para', 'necesito para inscribir'
                ],
                'handler': 'obtener_prerrequisitos'
            },
            'info_curso': {
                'patterns': [
                    'información de', 'info del curso', 'cuéntame sobre',
                    'qué es', 'de qué trata', 'cuántos créditos tiene',
                    'en qué semestre se lleva', 'detalles de'
                ],
                'handler': 'obtener_info_curso'
            },
            'creditos': {
                'patterns': [
                    'créditos', 'cuántos créditos', 'número de créditos',
                    'creditos de', 'vale cuantos creditos'
                ],
                'handler': 'obtener_creditos'
            },
            'buscar_curso': {
                'patterns': [
                    'buscar curso', 'qué curso', 'cuál es el código',
                    'código de', 'nombre del curso', 'cómo se llama el curso'
                ],
                'handler': 'buscar_por_nombre'
            },
            'cursos_semestre': {
                'patterns': [
                    'cursos del semestre', 'qué cursos hay en', 'cursos de', 'semestre',
                    'dame los cursos del', 'cuáles son los cursos'
                ],
                'handler': 'obtener_cursos_semestre'
            },
            'cursos_sin_prereq': {
                'patterns': [
                    'sin prerrequisitos', 'sin requisitos', 'cursos sin prereq',
                    'no tienen prerrequisitos', 'puedo llevar desde el inicio'
                ],
                'handler': 'obtener_cursos_sin_prereq'
            },
            'prereq_inverso': {
                'patterns': [
                    'para qué cursos es prerrequisito', 'dónde necesito', 'dónde se usa',
                    'qué cursos requieren', 'para qué sirve', 'es requisito de'
                ],
                'handler': 'obtener_prereq_inverso'
            },
            'cursos_creditos': {
                'patterns': [
                    'cursos de créditos', 'cursos que valen', 'cursos con créditos',
                    'dame cursos de', 'créditos'
                ],
                'handler': 'obtener_cursos_por_creditos'
            },
            'estadisticas': {
                'patterns': [
                    'estadísticas', 'cuántos cursos tiene', 'total de créditos',
                    'información del pensum', 'datos de la carrera'
                ],
                'handler': 'obtener_estadisticas'
            },
            'ruta_prereq': {
                'patterns': [
                    'ruta de prerrequisitos', 'qué debo llevar antes', 'cadena de',
                    'ruta completa', 'todo lo que necesito'
                ],
                'handler': 'obtener_ruta_prerequisitos'
            },
            'sugerencias': {
                'patterns': [
                    'qué cursos puedo llevar', 'recomiéndame', 'qué debería inscribir',
                    'sugerencias', 'qué me recomiendas', 'cursos disponibles para mí'
                ],
                'handler': 'obtener_sugerencias'
            },
            # --- INTENTS PERSONALIZADOS (requieren usuario) ---
            'mis_creditos': {
                'patterns': [
                    'cuántos créditos tengo', 'mis créditos', 'créditos aprobados',
                    'cuántos créditos llevo', 'total de créditos'
                ],
                'handler': 'obtener_mis_creditos'
            },
            'mis_aprobados': {
                'patterns': [
                    'mis cursos aprobados', 'qué cursos he aprobado', 'cursos que llevo',
                    'mis cursos', 'cursos aprobados', 'qué he cursado'
                ],
                'handler': 'obtener_mis_aprobados'
            },
            'aprobados_semestre': {
                'patterns': [
                    'cursos aprobados del semestre', 'qué aprobé del', 'cursos que aprobé',
                    'del semestre qué tengo', 'cuáles del semestre'
                ],
                'handler': 'obtener_aprobados_por_semestre'
            },
            'mi_progreso': {
                'patterns': [
                    'mi progreso', 'cuánto llevo', 'porcentaje de avance', 'avance',
                    'cómo voy', 'cuánto me falta'
                ],
                'handler': 'obtener_mi_progreso'
            },
            'ayuda': {
                'patterns': [
                    'ayuda', 'qué puedes hacer', 'cómo funciona', 'comandos',
                    'qué sabes hacer', 'help', 'opciones', 'menu'
                ],
                'responses': [
                    """✨ Puedo ayudarte con lo siguiente:
                    
📖 INFORMACIÓN - Detalles sobre cursos (código, nombre, créditos, semestre)
📋 PRERREQUISITOS - Requisitos previos para inscribir cursos
🔍 BÚSQUEDA - Localizar cursos por nombre o palabras clave
📚 SEMESTRE - Cursos disponibles por semestre
✅ SIN PREREQ - Cursos sin prerrequisitos
🔗 USO DE CURSO - Para qué cursos sirve uno específico
⭐ POR CRÉDITOS - Cursos con determinados créditos
📊 ESTADÍSTICAS - Información general del pensum
🗺️ RUTA - Cadena completa de prerrequisitos
💡 SUGERENCIAS - Cursos que puedes llevar según tu avance

📝 Ejemplos:
  - "¿Qué prerrequisitos tiene 0796?"
  - "Cursos del tercer semestre"
  - "¿Qué cursos no tienen prerrequisitos?"
  - "¿Para qué cursos sirve 0770?"
  - "Cursos de 5 créditos"
  - "Estadísticas del pensum"
  - "Ruta completa para 0972"
  - "¿Qué cursos puedo llevar?"

¡Pregúntame lo que necesites! 🎓"""
                ]
            },
            'desconocido': {
                'responses': [
                    'No estoy seguro de entender tu pregunta. ¿Podrías reformularla?',
                    'No comprendí bien. ¿Puedes ser más específico? Por ejemplo: "¿Qué prerrequisitos tiene Compiladores?"',
                    'Disculpa, no entendí. Intenta preguntar sobre: prerrequisitos, créditos, información de cursos o búsqueda.'
                ]
            }
        }
    
    def _entrenar_vectorizador(self):
        """Entrena el vectorizador TF-IDF con todos los patterns."""
        all_patterns = []
        for intent_data in self.intents.values():
            if 'patterns' in intent_data:
                all_patterns.extend(intent_data['patterns'])
        
        if all_patterns:
            self.vectorizer.fit(all_patterns)
    
    def _limpiar_texto(self, texto):
        """Limpia y normaliza el texto."""
        texto = texto.lower()
        texto = re.sub(r'[^\w\s]', '', texto)  # Remover puntuación
        
        if NLTK_AVAILABLE:
            tokens = word_tokenize(texto, language='spanish')
            tokens = [t for t in tokens if t not in self.stopwords]
            return ' '.join(tokens)
        else:
            # Método simple sin NLTK
            palabras = texto.split()
            palabras = [p for p in palabras if p not in self.stopwords]
            return ' '.join(palabras)
    
    def _detectar_intent(self, mensaje):
        """Detecta la intención del usuario usando similitud de texto."""
        mensaje_limpio = self._limpiar_texto(mensaje)
        
        mejor_intent = None
        mejor_score = 0
        
        for intent_name, intent_data in self.intents.items():
            if 'patterns' not in intent_data:
                continue
            
            # Vectorizar mensaje y patterns
            patterns = intent_data['patterns']
            vectors = self.vectorizer.transform([mensaje_limpio] + patterns)
            
            # Calcular similitud
            similitudes = cosine_similarity(vectors[0:1], vectors[1:])
            max_sim = similitudes.max()
            
            if max_sim > mejor_score:
                mejor_score = max_sim
                mejor_intent = intent_name
        
        # Umbral de confianza
        if mejor_score < 0.3:
            return 'desconocido', 0
        
        return mejor_intent, mejor_score
    
    def _normalizar_texto(self, texto):
        """Normaliza texto removiendo acentos/tildes."""
        # Mapeo de caracteres con acento a sin acento
        replacements = {
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N',
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
        }
        for original, replacement in replacements.items():
            texto = texto.replace(original, replacement)
        return texto
    
    def _cargar_todos_los_pensums(self):
        """Carga todos los archivos CSV de la carpeta Pensums."""
        path_pensums = './Data/Pensums/*.csv'
        archivos = glob.glob(path_pensums)
        
        for archivo in archivos:
            try:
                # Nombre de carrera basado en nombre de archivo (ej: 'sistemas.csv' -> 'sistemas')
                nombre_carrera = os.path.basename(archivo).replace('.csv', '').lower()
                df = pd.read_csv(archivo)
                
                # Normalizar
                df['codigo'] = df['codigo'].astype(str).str.zfill(4)
                df['nombre_completo'] = df['nombre_completo'].str.upper()
                
                cursos_dict = {}
                for _, row in df.iterrows():
                    prereqs_str = str(row['pre_requisitos']) if pd.notna(row['pre_requisitos']) else ''
                    if prereqs_str and prereqs_str != 'Ninguno' and prereqs_str != 'nan':
                        prereqs_list = [p.strip().zfill(4) for p in prereqs_str.split(',') if p.strip()]
                    else:
                        prereqs_list = []
                    
                    cursos_dict[row['codigo']] = {
                        'nombre': row['nombre_completo'],
                        'creditos': int(row['creditos']) if pd.notna(row['creditos']) else 3,
                        'semestre': str(row['semestre']),
                        'prereqs': str(row['pre_requisitos']) if pd.notna(row['pre_requisitos']) else 'Ninguno',
                        'prerrequisitos': prereqs_list
                    }
                
                self.pensums[nombre_carrera] = cursos_dict
                print(f"✅ Pensum cargado: {nombre_carrera} ({len(cursos_dict)} cursos)")
            except Exception as e:
                print(f"❌ Error cargando pensum {archivo}: {e}")

    def _get_pensum_activo(self, contexto):
        """Retorna el diccionario de cursos apropiado según la carrera del usuario."""
        if not contexto or 'carrera' not in contexto:
            return self.cursos_info # Default (Sistemas)
        
        carrera_raw = self._normalizar_texto(contexto['carrera']).lower()
        
        # Mapeo simple de nombres de carrera a keys de pensums
        mapa = {
            'sistema': 'sistemas',
            'civil': 'civil',
            'industrial': 'industrial',
            'mecanica': 'mecanica',
            'electrica': 'electrica', # Ojo con mecanica_electrica
            'electronica': 'electronica',
            'quimica': 'quimica',
            'ambiental': 'ambiental'
        }
        
        # Claves compuestas primero para evitar match parcial incorrecto
        if 'mecanica electrica' in carrera_raw or 'mecanica electrica' in carrera_raw:
             return self.pensums.get('mecanica_electrica', self.cursos_info)
        if 'mecanica industrial' in carrera_raw:
             return self.pensums.get('mecanica_industrial', self.cursos_info)

        for key, value in mapa.items():
            if key in carrera_raw:
                return self.pensums.get(value, self.cursos_info)
        
        return self.cursos_info

    def _extraer_codigo_curso(self, mensaje, cursos_dict=None):
        """Extrae código de curso buscando en el diccionario proporcionado."""
        if cursos_dict is None:
            cursos_dict = self.cursos_info
            
        # 1. Buscar código directo (ej: "0796", "796")
        match_codigo = re.search(r'\b\d{3,4}\b', mensaje)
        if match_codigo:
            codigo = match_codigo.group().zfill(4)
            if codigo in cursos_dict:
                return codigo
        
        # 2. Buscar por nombre
        mensaje_limpio = re.sub(r'[^\w\s]', ' ', mensaje)
        mensaje_norm = self._normalizar_texto(mensaje_limpio.upper())
        palabras_mensaje = mensaje_norm.split()
        
        mejor_codigo = None
        mejor_porcentaje = 0
        
        for codigo, info in cursos_dict.items():
            nombre_norm = self._normalizar_texto(info['nombre'].upper())
            palabras_nombre = nombre_norm.split()
            
            coincidencias = sum(1 for p in palabras_nombre if p in palabras_mensaje)
            porcentaje = coincidencias / len(palabras_nombre) if palabras_nombre else 0
            
            if porcentaje > mejor_porcentaje and porcentaje >= 0.6:
                mejor_porcentaje = porcentaje
                mejor_codigo = codigo
        
        return mejor_codigo
    
    def obtener_prerrequisitos(self, mensaje, contexto=None):
        """Obtiene prerrequisitos de un curso."""
        cursos_dict = self._get_pensum_activo(contexto)
        codigo = self._extraer_codigo_curso(mensaje, cursos_dict)
        
        if not codigo:
            return "🤔 No pude identificar el curso. Por favor especifica el código o el nombre completo."
        
        info = cursos_dict[codigo]
        prereqs = info['prereqs']
        
        respuesta = f"📚 {info['nombre']}\n🔢 Código: {codigo}\n\n"
        
        if prereqs == 'Ninguno' or prereqs == 'nan' or not prereqs or prereqs == 'N/A':
            respuesta += "✅ ¡Genial! Este curso NO tiene prerrequisitos."
        else:
            respuesta += f"📋 Prerrequisitos:\n"
            prereqs_lista = prereqs.split(',')
            for prereq in prereqs_lista:
                prereq = prereq.strip().zfill(4)
                if prereq in cursos_dict:
                    respuesta += f"  - {prereq}: {cursos_dict[prereq]['nombre']}\n"
                else:
                    respuesta += f"  - {prereq}\n"
        
        return respuesta
    
    def obtener_info_curso(self, mensaje, contexto=None):
        """Obtiene información completa de un curso."""
        cursos_dict = self._get_pensum_activo(contexto)
        codigo = self._extraer_codigo_curso(mensaje, cursos_dict)
        
        if not codigo:
            return "🤔 ¿De qué curso quieres información? Dame el código o nombre completo."
        
        info = cursos_dict[codigo]
        
        respuesta = f"""📖 INFORMACIÓN DEL CURSO

🔢 Código: {codigo}
📚 Nombre: {info['nombre']}
⭐ Créditos: {info['creditos']}
📅 Semestre: {info['semestre']}
📋 Prerrequisitos: {info['prereqs'] if info['prereqs'] != 'Ninguno' else 'Ninguno'}
"""
        return respuesta
    
    def obtener_creditos(self, mensaje, contexto=None):
        """Obtiene solo los créditos de un curso."""
        cursos_dict = self._get_pensum_activo(contexto)
        codigo = self._extraer_codigo_curso(mensaje, cursos_dict)
        
        if not codigo:
            return "🤔 ¿De qué curso quieres saber los créditos? Dame el código o nombre completo."
        
        info = cursos_dict[codigo]
        return f"📚 {info['nombre']}\n⭐ Créditos: {info['creditos']}"
    
    def buscar_por_nombre(self, mensaje, contexto=None):
        """Busca cursos por nombre o palabras clave."""
        cursos_dict = self._get_pensum_activo(contexto)
        
        # Extraer palabras clave del mensaje
        mensaje_limpio = self._limpiar_texto(mensaje)
        palabras_busqueda = [p for p in mensaje_limpio.split() if len(p) > 3]
        
        if not palabras_busqueda:
            return "🤔 ¿Qué curso estás buscando? Dame algunas palabras clave."
        
        # Buscar en nombres de cursos
        resultados = []
        for codigo, info in cursos_dict.items():
            nombre = info['nombre']
            coincidencias = sum(1 for palabra in palabras_busqueda 
                              if palabra.upper() in nombre)
            
            if coincidencias > 0:
                resultados.append((codigo, nombre, coincidencias))
        
        if not resultados:
            return f"😅 No encontré cursos relacionados con: {' '.join(palabras_busqueda)}. Intenta con otras palabras."
        
        # Ordenar por relevancia
        resultados.sort(key=lambda x: x[2], reverse=True)
        
        respuesta = "🔍 RESULTADOS DE BÚSQUEDA\n\n"
        for codigo, nombre, _ in resultados[:5]:  # Top 5
            respuesta += f"  - {codigo}: {nombre}\n"
        
        if len(resultados) > 5:
            respuesta += f"\n📊 (Mostrando 5 de {len(resultados)} resultados)"
        
        return respuesta
    
    def obtener_cursos_semestre(self, mensaje):
        """Obtiene cursos de un semestre específico."""
        # Buscar número de semestre en el mensaje
        import re
        match = re.search(r'\b(\d+|primer|segundo|tercer|cuarto|quinto|sexto|septimo|octavo|noveno|decimo)\b', mensaje.lower())
        
        if not match:
            return "¿De qué semestre quieres ver los cursos? Ej: 'cursos del tercer semestre'"
        
        # Convertir texto/número a nombre completo del semestre
        semestre_texto = match.group(1)
        conversion = {
            '1': 'Primero', 'primer': 'Primero', 'primero': 'Primero',
            '2': 'Segundo', 'segundo': 'Segundo',
            '3': 'Tercero', 'tercer': 'Tercero', 'tercero': 'Tercero',
            '4': 'Cuarto', 'cuarto': 'Cuarto',
            '5': 'Quinto', 'quinto': 'Quinto',
            '6': 'Sexto', 'sexto': 'Sexto',
            '7': 'Séptimo', 'septimo': 'Séptimo', 'séptimo': 'Séptimo',
            '8': 'Octavo', 'octavo': 'Octavo',
            '9': 'Noveno', 'noveno': 'Noveno',
            '10': 'Décimo', 'decimo': 'Décimo', 'décimo': 'Décimo'
        }
        semestre = conversion.get(semestre_texto, semestre_texto)
        
        # Buscar cursos del semestre (normalizar para comparación)
        cursos = []
        for codigo, info in self.cursos_info.items():
            sem_curso = self._normalizar_texto(info.get('semestre', ''))
            sem_buscar = self._normalizar_texto(semestre)
            if sem_curso.upper() == sem_buscar.upper():
                cursos.append((codigo, info['nombre'], info.get('creditos', 'N/A')))
        
        if not cursos:
            return f"😅 No encontré cursos del semestre {semestre}."
        
        respuesta = f"📚 CURSOS DEL SEMESTRE {semestre.upper()}\n\n"
        for codigo, nombre, creditos in cursos[:10]:
            respuesta += f"  - {codigo}: {nombre} ⭐ {creditos} créditos\n"
        
        if len(cursos) > 10:
            respuesta += f"\n(Mostrando 10 de {len(cursos)} cursos)"
        
        return respuesta
    
    def obtener_cursos_sin_prereq(self, mensaje):
        """Obtiene cursos que no tienen prerrequisitos."""
        cursos_sin_prereq = []
        
        for codigo, info in self.cursos_info.items():
            prereqs = info.get('prerrequisitos', [])
            if not prereqs or prereqs == ['']:
                cursos_sin_prereq.append((codigo, info['nombre'], info.get('semestre', 'N/A')))
        
        if not cursos_sin_prereq:
            return "🤔 Todos los cursos tienen prerrequisitos."
        
        respuesta = "✅ CURSOS SIN PRERREQUISITOS\n\n"
        for codigo, nombre, semestre in cursos_sin_prereq[:15]:
            respuesta += f"  - {codigo}: {nombre} 📅 Sem: {semestre}\n"
        
        if len(cursos_sin_prereq) > 15:
            respuesta += f"\n(Mostrando 15 de {len(cursos_sin_prereq)} cursos)"
        
        return respuesta
    
    def obtener_prereq_inverso(self, mensaje):
        """Muestra para qué cursos sirve un curso como prerrequisito."""
        codigo = self._extraer_codigo_curso(mensaje)
        
        if not codigo:
            return "¿De qué curso quieres saber para qué sirve? Dame el código o nombre completo."
        
        curso_info = self.cursos_info.get(codigo)
        if not curso_info:
            return f"No encontré información del código {codigo}."
        
        # Buscar cursos que requieren este como prerequisito
        cursos_que_requieren = []
        for cod, info in self.cursos_info.items():
            prereqs = info.get('prerrequisitos', [])
            if codigo in prereqs:
                cursos_que_requieren.append((cod, info['nombre']))
        
        respuesta = f"📚 {curso_info['nombre']}\n🔢 Código: {codigo}\n\n"
        
        if cursos_que_requieren:
            respuesta += "🔗 ES PRERREQUISITO DE\n"
            for cod, nombre in cursos_que_requieren:
                respuesta += f"  - {cod}: {nombre}\n"
        else:
            respuesta += "ℹ️ Este curso NO es prerrequisito de ningún otro curso."
        
        return respuesta
    
    def obtener_cursos_por_creditos(self, mensaje):
        """Obtiene cursos con determinado número de créditos."""
        import re
        match = re.search(r'\b(\d+)\b', mensaje)
        
        if not match:
            return "¿De cuántos créditos quieres ver los cursos? Ej: 'cursos de 5 créditos'"
        
        creditos_buscados = int(match.group(1))
        
        cursos = []
        for codigo, info in self.cursos_info.items():
            creditos = info.get('creditos')
            if creditos == creditos_buscados:
                cursos.append((codigo, info['nombre'], info.get('semestre', 'N/A')))
        
        if not cursos:
            return f"No encontré cursos de {creditos_buscados} créditos."
        
        respuesta = f"⭐ CURSOS DE {creditos_buscados} CRÉDITOS\n\n"
        for codigo, nombre, semestre in cursos[:15]:
            respuesta += f"  - {codigo}: {nombre} (Sem: {semestre})\n"
        
        if len(cursos) > 15:
            respuesta += f"\n(Mostrando 15 de {len(cursos)} cursos)"
        
        return respuesta
    
    def obtener_estadisticas(self, mensaje):
        """Muestra estadísticas generales del pensum."""
        total_cursos = len(self.cursos_info)
        total_creditos = sum(info.get('creditos', 0) for info in self.cursos_info.values())
        
        # Agrupar por semestre
        por_semestre = {}
        for info in self.cursos_info.values():
            sem = info.get('semestre', 'N/A')
            por_semestre[sem] = por_semestre.get(sem, 0) + 1
        
        # Agrupar por créditos
        por_creditos = {}
        for info in self.cursos_info.values():
            cred = info.get('creditos', 0)
            por_creditos[cred] = por_creditos.get(cred, 0) + 1
        
        respuesta = "📊 ESTADÍSTICAS DEL PENSUM\n\n"
        respuesta += f"Total de cursos: {total_cursos}\n"
        respuesta += f"Total de créditos: {total_creditos}\n"
        respuesta += f"Promedio de créditos por curso: {total_creditos/total_cursos:.1f}\n\n"
        
        respuesta += "📚 DISTRIBUCIÓN POR SEMESTRE\n"
        for sem in sorted(por_semestre.keys()):
            respuesta += f"  {sem}: {por_semestre[sem]} cursos\n"
        
        return respuesta
    
    def obtener_ruta_prerequisitos(self, mensaje):
        """Muestra la cadena completa de prerrequisitos de un curso."""
        codigo = self._extraer_codigo_curso(mensaje)
        
        if not codigo:
            return "¿De qué curso quieres ver la ruta completa? Dame el código o nombre."
        
        curso_info = self.cursos_info.get(codigo)
        if not curso_info:
            return f"No encontré información del código {codigo}."
        
        # BFS para obtener toda la cadena
        visitados = set()
        ruta = []
        
        def obtener_prereqs_recursivo(cod, nivel=0):
            if cod in visitados or cod not in self.cursos_info:
                return
            visitados.add(cod)
            
            info = self.cursos_info[cod]
            ruta.append((nivel, cod, info['nombre']))
            
            prereqs = info.get('prerrequisitos', [])
            for prereq in prereqs:
                if prereq and prereq != '':
                    obtener_prereqs_recursivo(prereq, nivel + 1)
        
        obtener_prereqs_recursivo(codigo)
        
        respuesta = f"🗺️ RUTA COMPLETA PARA {curso_info['nombre']} ({codigo})\n\n"
        
        if len(ruta) == 1:
            respuesta += "ℹ️ Este curso NO tiene prerrequisitos.\n"
        else:
            # Organizar por niveles
            por_nivel = {}
            for nivel, cod, nombre in ruta[1:]:  # Excluir el curso principal
                if nivel not in por_nivel:
                    por_nivel[nivel] = []
                por_nivel[nivel].append((cod, nombre))
            
            respuesta += "📋 PRERREQUISITOS DIRECTOS E INDIRECTOS\n"
            for nivel in sorted(por_nivel.keys()):
                respuesta += f"\n🔸 Nivel {nivel}:\n"
                for cod, nombre in por_nivel[nivel]:
                    respuesta += f"  • {cod}: {nombre}\n"
        
        return respuesta
    
    # ========== HANDLERS PERSONALIZADOS (Optimizados sin API request) ==========
    
    def obtener_mis_creditos(self, mensaje, contexto=None):
        """Obtiene el total de créditos aprobados usando datos del contexto."""
        if not contexto or 'lista_aprobados' not in contexto:
            return """📊 MIS CRÉDITOS

Para ver tus créditos necesito que estés logueado y tengas cursos aprobados.

💡 Inicia sesión y ve al Dashboard para agregar tus cursos."""

        aprobados = contexto['lista_aprobados']
        if not aprobados:
            return """📊 MIS CRÉDITOS

Aún no tienes cursos aprobados registrados.
💡 Ve al Dashboard para agregar tus cursos."""

        # Forzar cast a int
        total_creditos = sum([int(c.get('creditos', 0)) for c in aprobados])
        total_cursos = len(aprobados)
        progreso = round((total_creditos / 300) * 100, 1)
        
        return f"""📊 MIS CRÉDITOS

✅ Has aprobado {total_cursos} cursos
⭐ Total: {total_creditos} créditos
📈 Progreso: {progreso}% del pensum

🎯 Te faltan {300 - total_creditos} créditos para completar la carrera.

💡 Pregunta "qué cursos puedo llevar" para ver sugerencias."""

    def _normalizar_semestre(self, sem_input):
        """Convierte cualquier formato de semestre a nombre estándar usando regex."""
        sem_str = str(sem_input).strip().lower()
        
        # Mapeo directo de palabras a números
        palabras_nums = {
            'primero': '1', 'primer': '1', 'i': '1',
            'segundo': '2', 'segund': '2', 'ii': '2',
            'tercero': '3', 'tercer': '3', 'iii': '3',
            'cuarto': '4', 'cuart': '4', 'iv': '4',
            'quinto': '5', 'quint': '5', 'v': '5',
            'sexto': '6', 'sext': '6', 'vi': '6',
            'septimo': '7', 'séptimo': '7', 'septim': '7', 'vii': '7',
            'octavo': '8', 'octav': '8', 'viii': '8',
            'noveno': '9', 'noven': '9', 'ix': '9',
            'decimo': '10', 'décimo': '10', 'decim': '10', 'x': '10'
        }
        
        numero = None
        
        # 1. Intentar buscar número dígito (1, 2, 10...)
        import re
        match_digit = re.search(r'\d+', sem_str)
        if match_digit:
            numero = match_digit.group()
        else:
            # 2. Intentar buscar palabra (primero, cuarto...)
            for k, v in palabras_nums.items():
                if k in sem_str:
                    numero = v
                    break
        
        # Mapeo final de Número -> Nombre Estándar
        mapa_final = {
            '1': 'Primero', '2': 'Segundo', '3': 'Tercero', '4': 'Cuarto', '5': 'Quinto',
            '6': 'Sexto', '7': 'Séptimo', '8': 'Octavo', '9': 'Noveno', '10': 'Décimo'
        }
        
        return mapa_final.get(numero, 'Sin clasificar')

    def obtener_mis_aprobados(self, mensaje, contexto=None):
        """Lista todos los cursos aprobados del usuario, clasificándolos por el pensum oficial."""
        if not contexto or 'lista_aprobados' not in contexto:
            return """📚 MIS CURSOS APROBADOS

Necesitas estar logueado para ver tus cursos."""

        aprobados = contexto['lista_aprobados']
        if not aprobados:
            return "No tienes cursos aprobados registrados aún."

        # Agrupar por semestre (Usando info REAL del pensum)
        por_semestre = {}
        
        for curso in aprobados:
            codigo = str(curso.get('codigo', ''))
            
            # Buscar info oficial en el pensum cargado
            info_oficial = self.cursos_info.get(codigo, {})
            raw_sem = info_oficial.get('semestre', curso.get('semestre', 'Sin clasificar'))
            
            sem_norm = self._normalizar_semestre(raw_sem)
            
            if sem_norm not in por_semestre:
                por_semestre[sem_norm] = []
            
            # Usar nombre oficial si existe, o el del usuario como fallback
            nombre_curso = info_oficial.get('nombre', curso.get('nombre', 'Desconocido'))
            creditos_curso = info_oficial.get('creditos', curso.get('creditos', 0))
            
            por_semestre[sem_norm].append({
                'codigo': codigo,
                'nombre': nombre_curso,
                'creditos': creditos_curso
            })
        
        respuesta = "📚 MIS CURSOS APROBADOS\n(Clasificados según Pensum Oficial)\n\n"
        
        semestres_orden = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", 
                           "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo", "Sin clasificar"]
        
        cursos_mostrados = 0
        for sem in semestres_orden:
            if sem in por_semestre:
                respuesta += f"📅 {sem.upper()}\n"
                for curso in por_semestre[sem]:
                    respuesta += f"  • {curso['codigo']} - {curso['nombre']} ({curso['creditos']} cr)\n"
                    cursos_mostrados += 1
                respuesta += "\n"
        
        total = len(aprobados)
        total_cred = sum([int(c.get('creditos', 0)) for c in aprobados])
        respuesta += f"✅ Total: {total} cursos | ⭐ {total_cred} créditos"
        
        return respuesta

    def obtener_aprobados_por_semestre(self, mensaje, contexto=None):
        """Muestra cursos aprobados de un semestre específico (según pensum oficial)."""
        if not contexto or 'lista_aprobados' not in contexto:
            return "Necesitas estar logueado para consultar tus cursos."

        # Detectar semestre deseado
        semestre_buscado = self._normalizar_semestre(mensaje)
        
        if semestre_buscado == 'Sin clasificar':
            return """🔍 ESPECIFICA EL SEMESTRE
Ejemplo: "Cursos aprobados del cuarto semestre" o "aprobados del semestre 4" """

        aprobados = contexto['lista_aprobados']
        
        # Filtrar normalizando el semestre de cada curso (Usando info oficial)
        del_semestre = []
        for c in aprobados:
            codigo = str(c.get('codigo', ''))
            info_oficial = self.cursos_info.get(codigo, {})
            
            # Obtener semestre REAL del pensum
            raw_sem = info_oficial.get('semestre', c.get('semestre', 'Sin clasificar'))
            
            if self._normalizar_semestre(raw_sem) == semestre_buscado:
                # Usar datos oficiales para mostrar
                c_data = c.copy()
                c_data['nombre'] = info_oficial.get('nombre', c.get('nombre'))
                c_data['creditos'] = info_oficial.get('creditos', c.get('creditos'))
                del_semestre.append(c_data)
        
        if not del_semestre:
            return f"""📚 SEMESTRE {semestre_buscado.upper()}
No tienes cursos aprobados de este semestre en tu historial."""

        respuesta = f"📚 APROBADOS - {semestre_buscado.upper()} SEMESTRE\n\n"
        for curso in del_semestre:
            respuesta += f"  • {curso['codigo']} - {curso['nombre']} ({curso['creditos']} cr)\n"
        
        return respuesta

    def obtener_mi_progreso(self, mensaje, contexto=None):
        """estadísticas de progreso."""
        if not contexto or 'lista_aprobados' not in contexto:
            return "Inicia sesión para ver tu progreso."

        aprobados = contexto['lista_aprobados']
        total_creditos = sum([int(c.get('creditos', 0)) for c in aprobados])
        progreso = round((total_creditos / 300) * 100, 1)
        
        # Promedio
        con_nota = [c for c in aprobados if c.get('nota') and str(c.get('nota')).replace('.','').isdigit()]
        promedio = 0
        if con_nota:
            suma = sum([float(c['nota']) * int(c['creditos']) for c in con_nota])
            cred = sum([int(c['creditos']) for c in con_nota])
            if cred > 0: promedio = round(suma / cred, 1)

        return f"""📊 MI PROGRESO
✅ Cursos: {len(aprobados)}
⭐ Créditos: {total_creditos}/300
📈 Avance: {progreso}%
🎯 Promedio: {promedio if promedio else 'N/A'}

💡 Sigue así!"""

    def obtener_sugerencias(self, mensaje, contexto=None):
        """Genera sugerencias reales basadas en los cursos aprobados."""
        if not contexto or 'lista_aprobados' not in contexto:
            return """💡 SUGERENCIAS GENÉRICAS
Para recomendaciones personalizadas, inicia sesión.

Mientras tanto:
1. Revisa cursos del 1er semestre
2. Busca cursos sin prerrequisitos"""

        aprobados_codigos = [str(c['codigo']) for c in contexto['lista_aprobados']]
        
        # Buscar cursos disponibles (prerrequisitos cubiertos y no aprobados aún)
        disponibles = []
        
        for codigo, info in self.cursos_info.items():
            # Si ya lo aprobó, saltar
            if codigo in aprobados_codigos:
                continue
                
            # Verificar prerrequisitos
            prereqs = info.get('prerrequisitos', [])
            cumple_requisitos = True
            
            if not prereqs:
                cumple_requisitos = True
            else:
                for req in prereqs:
                    if req not in aprobados_codigos:
                        cumple_requisitos = False
                        break
            
            if cumple_requisitos:
                disponibles.append({'codigo': codigo, **info})

        if not disponibles:
            return "¡Felicidades! Parece que has completado todo el pensum o no hay más cursos disponibles por ahora."

        # Limitar y organizar por semestre
        disponibles.sort(key=lambda x: (x['semestre'], x['nombre']))
        
        respuesta = "💡 SUGERENCIAS PERSONALIZADAS\n\nBasado en tus cursos aprobados, podrías llevar:\n\n"
        
        semestres_mostrados = []
        count = 0
        
        for curso in disponibles:
            sem = curso['semestre']
            if sem not in semestres_mostrados:
                respuesta += f"📘 {sem.upper()} SEMESTRE:\n"
                semestres_mostrados.append(sem)
            
            respuesta += f"  - {curso['nombre']} ({curso['creditos']} cr)\n"
            count += 1
            
            if count >= 8:  # Limitar para no saturar el chat
                break
        
        respuesta += f"\nTotal disponibles: {len(disponibles)} cursos."
        return respuesta

    def responder(self, mensaje, contexto_usuario=None):
        """
        Procesa el mensaje del usuario y retorna una respuesta.
        
        Args:
            mensaje (str): Pregunta del usuario
            contexto_usuario (dict): Información del usuario (cursos aprobados, etc.)
        
        Returns:
            dict: {'respuesta': str, 'intent': str, 'confianza': float}
        """
        # Detectar intención
        intent, confianza = self._detectar_intent(mensaje)
        
        # Extraer usuario del contexto
        usuario = None
        if contexto_usuario and isinstance(contexto_usuario, dict):
            usuario = contexto_usuario.get('usuario')
        
        # Si tiene handler específico, ejecutarlo
        if intent in self.intents and 'handler' in self.intents[intent]:
            handler_name = self.intents[intent]['handler']
            handler = getattr(self, handler_name, None)
            
            if handler:
                # Pasar contexto completo a handlers
                try:
                    respuesta = handler(mensaje, contexto=contexto_usuario)
                except TypeError:
                    # Fallback para handlers antiguos que no aceptan contexto
                    try:
                        respuesta = handler(mensaje)
                    except Exception as e:
                        print(f"Error executing handler {handler_name}: {e}")
                        respuesta = "Ocurrió un error al procesar tu solicitud."
            else:
                respuesta = "Disculpa, hubo un error procesando tu pregunta."
        
        # Si tiene respuestas predefinidas
        elif intent in self.intents and 'responses' in self.intents[intent]:
            respuestas = self.intents[intent]['responses']
            respuesta = np.random.choice(respuestas)
        
        else:
            respuesta = "No estoy seguro de cómo responder a eso. ¿Puedes reformular tu pregunta?"
        
        return {
            'respuesta': respuesta,
            'intent': intent,
            'confianza': round(float(confianza), 2)
        }


# -----------------------------------------------------------
# FUNCIONES AUXILIARES PARA MAIN.PY
# -----------------------------------------------------------

def crear_chatbot(path_pensum='./Data/pensum_sistemas.csv'):
    """Crea una instancia del chatbot académico."""
    return ChatbotAcademico(path_pensum)


# -----------------------------------------------------------
# PRUEBA DEL MÓDULO
# -----------------------------------------------------------

if __name__ == "__main__":
    print("🤖 Inicializando Chatbot Académico...")
    chatbot = crear_chatbot()
    
    print("\n" + "="*60)
    print("CHATBOT ACADÉMICO KAI - DEMO")
    print("="*60)
    print("Escribe 'salir' para terminar\n")
    
    # Pruebas predefinidas
    pruebas = [
        "Hola",
        "¿Qué prerrequisitos tiene Compiladores?",
        "Cuántos créditos vale Redes 1?",
        "Información de programación 2",
        "¿En qué semestre se lleva 0771?",
        "Buscar cursos de inteligencia",
        "Gracias",
        "Adiós"
    ]
    
    print("🧪 MODO PRUEBA AUTOMÁTICA\n")
    for pregunta in pruebas:
        print(f"👤 Usuario: {pregunta}")
        respuesta_obj = chatbot.responder(pregunta)
        print(f"🤖 Bot ({respuesta_obj['intent']}, {respuesta_obj['confianza']}): {respuesta_obj['respuesta']}")
        print("-" * 60 + "\n")
    
    print("\n🎮 MODO INTERACTIVO")
    print("Ahora puedes hacer tus propias preguntas:\n")
    
    while True:
        pregunta = input("👤 Tú: ")
        
        if pregunta.lower() in ['salir', 'exit', 'quit']:
            print("🤖 Bot: ¡Hasta luego! 👋")
            break
        
        if not pregunta.strip():
            continue
        
        respuesta_obj = chatbot.responder(pregunta)
        print(f"🤖 Bot: {respuesta_obj['respuesta']}\n")
