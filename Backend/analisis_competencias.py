from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def analizar_competencias_ia(cursos):
    """
    Analiza una lista de cursos aprobados y clasifica las competencias
    en áreas (Desarrollo, Ciencias, Hardware, Gestión) usando NLP (TF-IDF).
    """
    if not cursos:
        return []
    
    # Arquetipos Semánticos (Vocabulary rico para cada área)
    arquetipos = {
        "Desarrollo": "programación algoritmos estructuras datos desarrollo software ingeniería computación sistemas web móviles inteligencia artificial nube backend frontend fullstack código java python c++ sql base datos",
        "Ciencias": "matemática cálculo física estadística álgebra lineal lógica probabilidad ciencias exactas métodos numéricos investigación operaciones",
        "Hardware": "electrónica circuitos arquitectura computadoras redes telecomunicaciones digital microprocesadores hardware señales sistemas operativos internet cosas iot",
        "Gestión": "administración economía contabilidad proyectos sociales ética legislación emprendimiento gerencia liderazgo finanzas auditoría recursos humanos negocios"
    }
    
    areas_keys = list(arquetipos.keys())
    corpus = list(arquetipos.values())
    
    # Agregar nombres de cursos (limpieza básica)
    nombres_cursos = [c.get('nombre', '') for c in cursos]
    corpus.extend(nombres_cursos)
    
    try:
        # Vectorización TF-IDF
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Separar vectores
        # Las primeras 4 filas corresponden a los 4 arquetipos definidos
        arquetipos_vectors = tfidf_matrix[:len(areas_keys)]
        # El resto son los cursos del estudiante
        cursos_vectors = tfidf_matrix[len(areas_keys):]
        
        # Similitud del Coseno
        # Comparamos cada curso contra los 4 arquetipos
        similarity_matrix = cosine_similarity(cursos_vectors, arquetipos_vectors)
        
        scores = {area: {'suma': 0, 'count': 0} for area in areas_keys}
        
        for i, similitudes in enumerate(similarity_matrix):
            # Encontrar el área con mayor similitud para este curso
            mejor_area_idx = np.argmax(similitudes)
            mejor_area_score = similitudes[mejor_area_idx]
            
            # Umbral de relevancia semántica (ajustable)
            if mejor_area_score > 0.05:
                area_nombre = areas_keys[mejor_area_idx]
                nota = cursos[i].get('nota', 0)
                scores[area_nombre]['suma'] += nota
                scores[area_nombre]['count'] += 1
        
        resultado = []
        for area in areas_keys:
            data = scores[area]
            promedio = round(data['suma'] / data['count']) if data['count'] > 0 else 0
            resultado.append({
                "subject": area,
                "A": promedio,
                "fullMark": 100
            })
            
        return resultado
        
    except Exception as e:
        print(f"Error en NLP analisis_competencias: {e}")
        # Retornar lista vacía en caso de error para no romper el flujo
        return []
