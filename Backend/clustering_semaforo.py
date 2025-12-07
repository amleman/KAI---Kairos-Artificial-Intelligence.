# -----------------------------------------------------------
# CLUSTERING SEMAFORO - MÓDULO DE ANÁLISIS DE CARGA ACADÉMICA
# -----------------------------------------------------------
import os
# Configurar variable de entorno para evitar problemas con joblib en Windows
os.environ['LOKY_MAX_CPU_COUNT'] = '1'

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')


class AnalizadorCargaAcademica:
    # Clasifica cursos en 3 niveles: 1=Verde (Facil), 2=Amarillo (Medio), 3=Rojo (Dificil)
    
    def __init__(self, path_pensum):
        self.df_pensum = pd.read_csv(path_pensum)
        self.modelo_kmeans = None
        self.scaler = StandardScaler()
        self.cursos_clasificados = {}
        
        # Entrenar el modelo automáticamente
        self._entrenar_modelo()
    
    def _extraer_caracteristicas(self, df):
        # Extrae features: creditos, semestre, prerrequisitos, palabras clave
        features = []
        
        for _, row in df.iterrows():
            codigo = str(row['codigo']).strip()
            nombre = str(row['nombre_completo']).upper()
            creditos = int(row['creditos']) if pd.notna(row['creditos']) else 3
            semestre = str(row['semestre']).lower()
            prereqs_str = str(row['pre_requisitos']).strip()
            
            # Feature 1: Créditos (más créditos = más difícil)
            feature_creditos = creditos * 2  # Amplificado
            
            # Feature 2: Semestre (cursos avanzados = más difíciles)
            semestre_map = {
                'primero': 1, 'segundo': 2, 'tercero': 4, 
                'cuarto': 6, 'quinto': 8, 'sexto': 10,
                'séptimo': 12, 'septimo': 12, 'octavo': 14,
                'noveno': 16, 'décimo': 18, 'decimo': 18
            }
            feature_semestre = semestre_map.get(semestre, 5) * 1.5
            
            # Feature 3: Cantidad de prerrequisitos (multiplicado)
            if pd.isna(prereqs_str) or prereqs_str == '' or prereqs_str == 'nan':
                feature_prereqs = 0
            else:
                prereqs_lista = [p.strip() for p in prereqs_str.replace('"', '').split(',')]
                feature_prereqs = len([p for p in prereqs_lista if p]) * 3
            
            # Feature 4: Puntaje de palabras clave de dificultad (MÁS AGRESIVO)
            palabras_muy_dificil = ['COMPILADOR', 'ARQUITECTURA', 'SISTEMAS OPERATIVOS',
                                    'INTELIGENCIA ARTIFICIAL', 'REDES', 'SOFTWARE AVANZADO']
            
            palabras_dificil = ['MATEMÁTICA', 'MATEMATICA', 'FÍSICA', 'FISICA',
                               'PROGRAMACIÓN', 'PROGRAMACION', 'ALGORITMOS', 
                               'ESTRUCTURAS DE DATOS', 'BASE DE DATOS']
            
            palabras_facil = ['ÉTICA', 'ETICA', 'SOCIAL', 'HUMANÍSTICA', 'HUMANISTICA',
                             'DEPORTES', 'IDIOMA', 'TÉCNICAS DE ESTUDIO', 'FILOSOFIA',
                             'PSICOLOGIA', 'ECONOMIA', 'LOGICA']
            
            puntaje_dificultad = 0
            
            for palabra in palabras_muy_dificil:
                if palabra in nombre:
                    puntaje_dificultad += 10  # PESO ALTO
            
            for palabra in palabras_dificil:
                if palabra in nombre:
                    puntaje_dificultad += 5  # PESO MEDIO
            
            for palabra in palabras_facil:
                if palabra in nombre:
                    puntaje_dificultad -= 5  # REDUCCIÓN
            
            # Feature 5: Bonus por códigos específicos conocidos
            if codigo.startswith('0') and len(codigo) == 4:
                num_code = int(codigo)
                # Cursos 0001-0050 tienden a ser básicos/humanísticos
                if num_code <= 50:
                    puntaje_dificultad -= 3
                # Cursos 0700+ tienden a ser técnicos/difíciles
                elif num_code >= 700:
                    puntaje_dificultad += 5
            
            features.append([
                feature_creditos,
                feature_semestre,
                feature_prereqs,
                puntaje_dificultad
            ])
        
        return np.array(features)
    
    def _entrenar_modelo(self):
        # Extraer características
        X = self._extraer_caracteristicas(self.df_pensum)
        
        # Normalizar datos
        X_scaled = self.scaler.fit_transform(X)
        
        # Aplicar K-Means con 3 clusters
        self.modelo_kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = self.modelo_kmeans.fit_predict(X_scaled)
        
        # Asignar niveles (ordenar clusters por dificultad promedio)
        cluster_means = []
        for i in range(3):
            cluster_indices = np.where(labels == i)[0]
            cluster_mean = X[cluster_indices].mean(axis=0).sum()  # Suma de promedios
            cluster_means.append((i, cluster_mean))
        
        # Ordenar: menor mean = Nivel 1 (Verde), mayor = Nivel 3 (Rojo)
        cluster_means.sort(key=lambda x: x[1])
        cluster_to_nivel = {
            cluster_means[0][0]: 1,  # Verde (Fácil)
            cluster_means[1][0]: 2,  # Amarillo (Medio)
            cluster_means[2][0]: 3   # Rojo (Difícil)
        }
        
        # Guardar clasificación en diccionario
        for idx, row in self.df_pensum.iterrows():
            # Convertir código a string con padding de 4 dígitos
            codigo = str(int(row['codigo'])).zfill(4)
            cluster = labels[idx]
            nivel = cluster_to_nivel[cluster]
            self.cursos_clasificados[codigo] = {
                'codigo': codigo,
                'nombre': row['nombre_completo'],
                'nivel': nivel,
                'cluster': int(cluster)
            }
    
    def obtener_nivel_curso(self, codigo):
        # Normalizar código con padding de 4 dígitos
        codigo = str(codigo).strip()
        if codigo.isdigit():
            codigo = codigo.zfill(4)
        return self.cursos_clasificados.get(codigo, None)
    
    def analizar_seleccion(self, lista_codigos):
        # Analiza cursos y retorna semaforo (verde/amarillo/rojo)
        if not lista_codigos:
            return {
                'semaforo': 'verde',
                'nivel_promedio': 0,
                'cursos_por_nivel': {1: 0, 2: 0, 3: 0},
                'mensaje': 'No has seleccionado cursos',
                'desglose': []
            }
        
        cursos_por_nivel = {1: 0, 2: 0, 3: 0}
        desglose = []
        niveles = []
        
        for codigo in lista_codigos:
            info = self.obtener_nivel_curso(codigo)
            if info:
                nivel = info['nivel']
                cursos_por_nivel[nivel] += 1
                niveles.append(nivel)
                desglose.append({
                    'codigo': codigo,
                    'nombre': info['nombre'],
                    'nivel': nivel
                })
            else:
                # Curso no encontrado, asumir nivel medio
                cursos_por_nivel[2] += 1
                niveles.append(2)
                desglose.append({
                    'codigo': codigo,
                    'nombre': 'Curso desconocido',
                    'nivel': 2
                })
        
        # Calcular nivel promedio
        nivel_promedio = sum(niveles) / len(niveles) if niveles else 0
        
        # Determinar semáforo basado en reglas REALISTAS
        total_cursos = len(lista_codigos)
        cursos_dificiles = cursos_por_nivel[3]
        cursos_medios = cursos_por_nivel[2]
        cursos_faciles = cursos_por_nivel[1]
        
        # REGLA 1: Pocos cursos (1-3) - Carga ligera independiente de dificultad
        if total_cursos <= 3:
            if cursos_dificiles >= 2:
                semaforo = 'amarillo'
                mensaje = f'CARGA MODERADA: Llevas {total_cursos} cursos con {cursos_dificiles} difíciles. Es manejable pero requiere dedicación.'
            else:
                semaforo = 'verde'
                mensaje = f'CARGA LIGERA: Solo {total_cursos} cursos. Carga muy manejable, considera agregar más cursos si tu horario lo permite.'
        
        # REGLA 2: Carga normal (4-5 cursos) - Evaluar balance
        elif total_cursos <= 5:
            if cursos_dificiles >= 3:
                semaforo = 'rojo'
                mensaje = f'CARGA PESADA: {cursos_dificiles} cursos difíciles de {total_cursos}. Considera cambiar algunos por cursos más ligeros.'
            elif cursos_dificiles >= 2 or nivel_promedio >= 2.3:
                semaforo = 'amarillo'
                mensaje = f'CARGA MODERADA: Balance entre {cursos_dificiles} difíciles, {cursos_medios} medios y {cursos_faciles} fáciles. Administra bien tu tiempo.'
            else:
                semaforo = 'verde'
                mensaje = f'CARGA BALANCEADA: {total_cursos} cursos bien distribuidos. Carga manejable y equilibrada.'
        
        # REGLA 3: Carga alta (6-7 cursos) - Siempre mínimo amarillo
        elif total_cursos <= 7:
            if cursos_dificiles >= 3:
                semaforo = 'rojo'
                mensaje = f'CARGA MUY PESADA: {total_cursos} cursos con {cursos_dificiles} difíciles. Riesgo alto de sobrecarga. Reduce la cantidad o dificultad.'
            elif cursos_dificiles >= 2 or cursos_medios >= 4:
                semaforo = 'rojo'
                mensaje = f'CARGA PESADA: {total_cursos} cursos es mucho. Aunque algunos sean fáciles, el volumen total puede afectar tu rendimiento.'
            else:
                semaforo = 'amarillo'
                mensaje = f'CARGA CONSIDERABLE: {total_cursos} cursos es una cantidad alta. Asegúrate de tener buena organización de tiempo.'
        
        # REGLA 4: Sobrecarga (8+ cursos) - Siempre rojo o amarillo fuerte
        else:
            if cursos_dificiles >= 2:
                semaforo = 'rojo'
                mensaje = f'SOBRECARGA CRÍTICA: {total_cursos} cursos con {cursos_dificiles} difíciles. Esto es insostenible. Reduce urgentemente tu carga.'
            else:
                semaforo = 'rojo'
                mensaje = f'SOBRECARGA: {total_cursos} cursos es demasiado, incluso si son fáciles. El volumen de trabajo será abrumador. Reduce a 5-6 cursos máximo.'
        
        return {
            'semaforo': semaforo,
            'nivel_promedio': round(nivel_promedio, 2),
            'cursos_por_nivel': cursos_por_nivel,
            'mensaje': mensaje,
            'desglose': desglose
        }
    
    def obtener_todos_cursos_clasificados(self):
        return list(self.cursos_clasificados.values())
    
    def obtener_cursos_por_nivel(self, nivel):
        # Retorna cursos de un nivel especifico (1, 2 o 3)
        return [
            curso for curso in self.cursos_clasificados.values() 
            if curso['nivel'] == nivel
        ]


# -----------------------------------------------------------
# FUNCIONES AUXILIARES PARA MAIN.PY
# -----------------------------------------------------------
def crear_analizador(path_pensum='Data/pensum_sistemas.csv'):
    return AnalizadorCargaAcademica(path_pensum)


def analizar_carga(analizador, codigos_seleccionados):
    return analizador.analizar_seleccion(codigos_seleccionados)


# -----------------------------------------------------------
# PRUEBA DEL MÓDULO
# -----------------------------------------------------------
if __name__ == "__main__":
    print("Probando el Analizador de Carga Academica...\n")
    
    analizador = crear_analizador()
    
    print("Caso 1: Carga PESADA")
    cursos_pesados = ['152', '796', '771', '112', '114']  # Física 2, Lenguajes, Progra 2, Mates
    resultado = analizar_carga(analizador, cursos_pesados)
    print(f"   Semáforo: {resultado['semaforo'].upper()}")
    print(f"   {resultado['mensaje']}")
    print(f"   Distribución: Nivel 1={resultado['cursos_por_nivel'][1]}, "
          f"Nivel 2={resultado['cursos_por_nivel'][2]}, "
          f"Nivel 3={resultado['cursos_por_nivel'][3]}\n")
    
    print("Caso 2: Carga BALANCEADA")
    cursos_balanceados = ['5', '1', '796', '732']  # Técnicas, Ética, Lenguajes, Estadística
    resultado = analizar_carga(analizador, cursos_balanceados)
    print(f"   Semáforo: {resultado['semaforo'].upper()}")
    print(f"   {resultado['mensaje']}")
    print(f"   Distribución: Nivel 1={resultado['cursos_por_nivel'][1]}, "
          f"Nivel 2={resultado['cursos_por_nivel'][2]}, "
          f"Nivel 3={resultado['cursos_por_nivel'][3]}\n")
    
    print("Caso 3: Carga LIGERA")
    cursos_ligeros = ['5', '1', '6', '39']  # Técnicas, Ética, Idioma, Deportes
    resultado = analizar_carga(analizador, cursos_ligeros)
    print(f"   Semáforo: {resultado['semaforo'].upper()}")
    print(f"   {resultado['mensaje']}")
    print(f"   Distribución: Nivel 1={resultado['cursos_por_nivel'][1]}, "
          f"Nivel 2={resultado['cursos_por_nivel'][2]}, "
          f"Nivel 3={resultado['cursos_por_nivel'][3]}\n")
    
    print("Pruebas completadas!")
