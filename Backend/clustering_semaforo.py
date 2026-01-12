# -----------------------------------------------------------
# CLUSTERING SEMAFORO - MÓDULO DE ANÁLISIS DE CARGA ACADÉMICA (MULTI-CARRERA)
# -----------------------------------------------------------
import os
# Configurar variable de entorno para evitar problemas con joblib en Windows/Cloud
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
        self.path_pensum = path_pensum
        self.df_pensum = pd.read_csv(path_pensum)
        self.modelo_kmeans = None
        self.scaler = StandardScaler()
        self.cursos_clasificados = {}
        
        # Entrenar el modelo automáticamente al instanciar
        print(f"Inicializando IA de dificultad para: {path_pensum}")
        self._entrenar_modelo()
    
    def _extraer_caracteristicas(self, df):
        features = []
        
        # -----------------------------------------------------------------
        # DICCIONARIO MAESTRO DE DIFICULTAD (FINAL - 9 CARRERAS USAC)
        # -----------------------------------------------------------------
        palabras_muy_dificil = [
            # FILTROS MATEMÁTICOS (EL "COCO" DE TODAS LAS CARRERAS)
            'MATEMATICA INTERMEDIA', 'MATEMÁTICA INTERMEDIA', 'AREA MATEMATICA INTERMEDIA', 
            'ÁREA MATEMÁTICA INTERMEDIA', 'INTERMEDIA 1', 'INTERMEDIA 2', 'INTERMEDIA 3',
            'ECUACIONES DIFERENCIALES', 'MATEMATICA APLICADA', 'MATEMÁTICA APLICADA', 
            'ANALISIS DE SISTEMAS',
            
            # SISTEMAS
            'COMPILADOR', 'ARQUITECTURA', 'SISTEMAS OPERATIVOS', 'INTELIGENCIA ARTIFICIAL', 
            'REDES', 'SOFTWARE AVANZADO', 'ASSEMBLER', 'AUTOMATAS', 'MICROPROCESADORES',
            'MODELACION', 'MODELACIÓN', 'SIMULACION', 'SIMULACIÓN', # Modelación y Simulación 1/2
            
            # QUIMICA / AMBIENTAL (HARDCORE)
            'TRANSFERENCIA', 'MASA', # Transferencia de Masa (Filtro mortal de IQ)
            'TERMODINAMICA', 'TERMODINÁMICA', 'FISICO QUIMICA', 'FÍSICO QUÍMICA', 
            'BIOQUIMICA', 'BIOQUÍMICA', 'ORGANICA', 'ORGÁNICA', 'ANALITICA', 'ANALÍTICA',
            'FENOMENOS DE TRANSPORTE', 'OPERACIONES UNITARIAS', 'REACTORES', 
            'DISEÑO DE PLANTAS', 'DINAMICA DE PROCESOS', 'CINETICA', 'CINÉTICA',
            'INSTRUMENTAL', # Análisis Instrumental
            
            # ELECTRICA / ELECTRONICA / MEC-ELEC
            'POTENCIA', 'TRANSMISION', 'TRANSMISIÓN', 'ALTA TENSION', 'ALTA TENSIÓN',
            'SUBESTACIONES', 'CONVERSION', 'CONVERSIÓN', 'MAQUINAS ELECTRICAS', 'MÁQUINAS ELÉCTRICAS',
            'ELECTROMAGNETICA', 'ELECTROMAGNÉTICA', 'ELECTROMAGNETISMO', 'CIRCUITOS', 
            'ELECTRONICA', 'ELECTRÓNICA', 'DIGITALES', 'TELECOMUNICACIONES', 'RADIOCOMUNICACIONES',
            'SEÑALES', 'CONTROL', 'AUTOMATIZACION', 'AUTOMATIZACIÓN', 'INSTRUMENTACION',
            'INSTALACIONES ELECTRICAS',
            
            # CIVIL / MECANICA / INDUSTRIAL
            'RESISTENCIA', 'MECANICA', 'MECÁNICA', 'ESTRUCTURA', 'CIMENTACIONES', 'CONCRETO', 
            'HIDRAULICA', 'HIDRÁULICA', 'SISMOLOGIA', 'SISMOLOGÍA', 'VIAS TERRESTRES', 
            'PUENTES', 'PAVIMENTOS', 'ARMADO', 
            'VIBRACIONES', 'MECANISMOS', 'DISEÑO DE MAQUINAS', 'DISEÑO DE MÁQUINAS', 
            'PLANTAS DE VAPOR', 'MOTORES', 'REFRIGERACION', 'REFRIGERACIÓN', 'METALURGIA',
            'METODOS', 'MÉTODOS', # Métodos es el filtro de Industrial
            'MONTAJE', 'MANTENIMIENTO'
        ]
        
        palabras_dificil = [
            # CIENCIAS BASICAS
            'MATEMÁTICA', 'MATEMATICA', 'CALCULO', 'CÁLCULO', 'FÍSICA', 'FISICA', 
            'ESTADISTICA', 'ESTADÍSTICA', 'PROBABILIDAD', 'NUMERICO', 'NUMÉRICO',
            'QUIMICA', 'QUÍMICA', # Químicas generales
            
            # SISTEMAS
            'PROGRAMACIÓN', 'PROGRAMACION', 'ALGORITMOS', 'ESTRUCTURAS DE DATOS', 'BASE DE DATOS',
            'SEGURIDAD', 'AUDITORIA', 'ORGANIZACIONALES',
            
            # QUIMICA / AMBIENTAL
            'AGUAS', 'DESECHOS', 'IMPACTO AMBIENTAL', 'GEOLOGIA', 'GEOLOGÍA', 'MATERIALES',
            'MICROBIOLOGIA', 'MICROBIOLOGÍA', 'PROCESOS', 'INDUSTRIALES', 'FARMACEUTICA',
            
            # CIVIL / MECANICA
            'SUELOS', 'TOPOGRAFIA', 'TOPOGRAFÍA', 'HIDROLOGIA', 'HIDROLOGÍA', 'SANITARIA', 
            'INSTALACIONES', 'GENERACION', 'MANUFACTURA', 
            
            # INDUSTRIAL / ADMON
            'FINANZAS', 'ECONOMIA', 'ECONOMÍA', 'MACROECONOMIA', 'MICROECONOMIA',
            'CONTABILIDAD', 'COSTOS', 'PRODUCCION', 'PRODUCCIÓN', 'PRESUPUESTO',
            'LOGISTICA', 'LOGÍSTICA', 'CADENA DE SUMINISTRO', 'CALIDAD', 'METROLOGIA',
            'TEXTIL', 'SEGURIDAD OCUPACIONAL', 'GESTION', 'GESTIÓN',
            'INVESTIGACION DE OPERACIONES'
        ]
        
        palabras_facil = [
            # HUMANISTICAS Y COMPLEMENTARIAS
            'ÉTICA', 'ETICA', 'SOCIAL', 'HUMANÍSTICA', 'HUMANISTICA', 'LITERATURA',
            'DEPORTES', 'IDIOMA', 'TECNICO', 'TÉCNICO', 'TÉCNICAS', 'TECNICAS',
            'FILOSOFIA', 'FILOSOFÍA', 'PSICOLOGIA', 'PSICOLOGÍA', 'LOGICA', 'LÓGICA',
            'HISTORIA', 'ECOLOGIA', 'ECOLOGÍA', 'AMBIENTE', 'SOSTENIBILIDAD', 
            'SEMINARIO', 'PRACTICAS', 'PRÁCTICAS', 'DIBUJO', 'ARTE',
            
            # ADMINISTRATIVAS LIGERAS
            'LEGISLACION', 'LEGISLACIÓN', 'CONSTITUCION', 'DERECHO', 
            'ADMINISTRACION', 'ADMINISTRACIÓN', 'RECURSOS HUMANOS', 'MERCADOTECNIA',
            'COMERCIO', 'NEGOCIOS', 'EMPRENDEDURISMO'
        ]

        for _, row in df.iterrows():
            codigo = str(row['codigo']).strip()
            nombre = str(row['nombre_completo']).upper()
            creditos = int(row['creditos']) if pd.notna(row['creditos']) else 3
            semestre = str(row['semestre']).lower()
            prereqs_str = str(row['pre_requisitos']).strip()
            
            # Feature 1: Créditos (más créditos = más difícil)
            feature_creditos = creditos * 2.5
            
            # Feature 2: Semestre (progresión lineal)
            semestre_map = {
                'primero': 1, 'segundo': 2, 'tercero': 4, 'cuarto': 6, 
                'quinto': 8, 'sexto': 10, 'séptimo': 12, 'septimo': 12, 
                'octavo': 14, 'noveno': 16, 'décimo': 18, 'decimo': 18
            }
            feature_semestre = semestre_map.get(semestre, 5) * 1.2
            
            # Feature 3: Prerrequisitos (cadena de dependencia)
            if pd.isna(prereqs_str) or prereqs_str in ['', 'nan', 'ninguno']:
                feature_prereqs = 0
            else:
                prereqs_lista = [p.strip() for p in prereqs_str.replace('"', '').replace(';', ',').split(',')]
                feature_prereqs = len([p for p in prereqs_lista if p]) * 3.5
            
            # Feature 4: Análisis Semántico (Palabras Clave)
            puntaje_dificultad = 0
            
            for palabra in palabras_muy_dificil:
                if palabra in nombre:
                    puntaje_dificultad += 12 # Muy alto impacto
            
            for palabra in palabras_dificil:
                if palabra in nombre:
                    puntaje_dificultad += 6  # Impacto medio
            
            for palabra in palabras_facil:
                if palabra in nombre:
                    puntaje_dificultad -= 6  # Reducción
            
            # Ajuste Fino por Códigos (Heurística USAC)
            # Cursos bajos (000-050) suelen ser comunes/fáciles
            if codigo.isdigit() and int(codigo) < 60:
                 puntaje_dificultad -= 2
            
            features.append([
                feature_creditos,
                feature_semestre,
                feature_prereqs,
                puntaje_dificultad
            ])
        
        return np.array(features)
    
    def _entrenar_modelo(self):
        X = self._extraer_caracteristicas(self.df_pensum)
        X_scaled = self.scaler.fit_transform(X)
        
        # Usamos K-Means para encontrar agrupaciones naturales en los datos
        self.modelo_kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = self.modelo_kmeans.fit_predict(X_scaled)
        
        # Mapeo dinámico: No asumimos que el cluster 0 es el fácil.
        # Calculamos el "score promedio" de cada cluster para ordenarlos.
        cluster_scores = []
        for i in range(3):
            indices = np.where(labels == i)[0]
            if len(indices) > 0:
                # Sumamos todas las features para tener un score de "dificultad"
                score_promedio = X[indices].sum(axis=1).mean()
                cluster_scores.append((i, score_promedio))
            else:
                cluster_scores.append((i, 0))
        
        # Ordenamos de menor score (Fácil) a mayor score (Difícil)
        cluster_scores.sort(key=lambda x: x[1])
        
        # Mapeamos Cluster ID -> Nivel (1, 2, 3)
        mapa_niveles = {
            cluster_scores[0][0]: 1, # Verde
            cluster_scores[1][0]: 2, # Amarillo
            cluster_scores[2][0]: 3  # Rojo
        }
        
        for idx, row in self.df_pensum.iterrows():
            codigo = str(row['codigo']).strip()
            # Estandarizar códigos numéricos a 4 dígitos para coincidir con motor_generador
            if codigo.isdigit():
                codigo = codigo.zfill(4)
                
            cluster_id = labels[idx]
            self.cursos_clasificados[codigo] = {
                'codigo': codigo,
                'nombre': row['nombre_completo'],
                'nivel': mapa_niveles[cluster_id],
                'cluster': int(cluster_id)
            }
            
    def obtener_nivel_curso(self, codigo):
        codigo = str(codigo).strip()
        if codigo.isdigit():
            codigo = codigo.zfill(4)
        return self.cursos_clasificados.get(codigo, None)
    
    def analizar_seleccion(self, lista_codigos):
        if not lista_codigos:
            return {'semaforo': 'verde', 'mensaje': 'Sin cursos', 'cursos_por_nivel': {1:0, 2:0, 3:0}}
        
        conteo = {1: 0, 2: 0, 3: 0}
        total = len(lista_codigos)
        
        for cod in lista_codigos:
            info = self.obtener_nivel_curso(cod)
            nivel = info['nivel'] if info else 2 # Default Medio si no encuentra
            conteo[nivel] += 1
            
        rojos = conteo[3]
        amarillos = conteo[2]
        
        # Lógica de Semáforo Generalizada
        semaforo = 'verde'
        mensaje = "Carga Equilibrada"
        
        if total > 6:
            semaforo = 'rojo'
            mensaje = f"Sobrecarga: {total} cursos es demasiado para cualquier carrera."
        elif rojos >= 3:
            semaforo = 'rojo'
            mensaje = f"Peligro: {rojos} cursos de alta dificultad (Nivel 3). Riesgo de reprobación."
        elif rojos == 2 and amarillos >= 2:
            semaforo = 'amarillo'
            mensaje = "Carga Pesada: 2 difíciles y varios medios. Requiere mucha disciplina."
        elif total >= 5 and rojos >= 2:
            semaforo = 'amarillo'
            mensaje = "Atención: Combinación exigente."
            
        return {
            'semaforo': semaforo,
            'mensaje': mensaje,
            'cursos_por_nivel': conteo
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
    
    # Intenta usar la ruta correcta asumiendo que se ejecuta desde Backend o root
    path = 'Data/Pensums/sistemas.csv'
    if not os.path.exists(path) and os.path.exists('Backend/'+path):
        path = 'Backend/'+path
    
    if os.path.exists(path):
        analizador = crear_analizador(path)
        
        print("Caso 1: Carga PESADA")
        cursos_pesados = ['0152', '0796', '0771', '0112', '0114']  # Física 2, Lenguajes, Progra 2, Mates
        resultado = analizar_carga(analizador, cursos_pesados)
        print(f"   Semáforo: {resultado['semaforo'].upper()}")
        print(f"   {resultado['mensaje']}")
        print(f"   Distribución: {resultado['cursos_por_nivel']}\n")
        
        print("Caso 2: Carga BALANCEADA")
        cursos_balanceados = ['0005', '0001', '0796', '0732']  # Técnicas, Ética, Lenguajes, Estadística
        resultado = analizar_carga(analizador, cursos_balanceados)
        print(f"   Semáforo: {resultado['semaforo'].upper()}")
        print(f"   {resultado['mensaje']}")
        print(f"   Distribución: {resultado['cursos_por_nivel']}\n")
        
        print("Caso 3: Carga LIGERA")
        cursos_ligeros = ['5', '1', '6', '39']  # Técnicas, Ética, Idioma, Deportes
        resultado = analizar_carga(analizador, cursos_ligeros)
        print(f"   Semáforo: {resultado['semaforo'].upper()}")
        print(f"   {resultado['mensaje']}")
        print(f"   Distribución: {resultado['cursos_por_nivel']}\n")
        
        print("Pruebas completadas!")
    else:
        print(f"No se encontró el archivo de pensum en: {path}")
