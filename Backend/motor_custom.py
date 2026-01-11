from financiero import AnalizadorFinanciero
import pandas as pd
import random
import numpy as np

class GeneradorHorarioCustom:
    def __init__(self, path_oferta, path_pensum='./Data/pensum_sistemas.csv'):
        # Cargar oferta y limpiar NaNs
        self.df_oferta = pd.read_csv(path_oferta, dtype=str).fillna("")
        
        # Convertir horas a enteros (minutos) para comparaciones matemáticas
        self.df_oferta['Inicio_Min'] = pd.to_numeric(self.df_oferta['Inicio_Min'], errors='coerce').fillna(0).astype(int)
        self.df_oferta['Final_Min'] = pd.to_numeric(self.df_oferta['Final_Min'], errors='coerce').fillna(0).astype(int)

        # Inicializar Analizador Financiero
        self.analizador_financiero = AnalizadorFinanciero(path_pensum)

    def aplicar_filtros_avanzados(self, df_filtrado, filtros):
        """
        Aplica los filtros avanzados separados por días (L-V y Sábado).
        Filtros esperados en el diccionario:
        1. hora_inicio_lv (int)
        2. hora_fin_lv (int)
        3. hora_inicio_sabado (int)
        4. hora_fin_sabado (int)
        5. catedratico (str): Nombre a BUSCAR (o evitar según lógica)
        6. modalidad (str): 'PRESENCIAL', 'VIRTUAL', 'HIBRIDA' o 'TODAS'
        """
        if not filtros:
            return df_filtrado

        # Filtro Hora de Lunes a Viernes
        h_inicio_lv = int(filtros.get("hora_inicio_lv", 0))
        h_fin_lv = int(filtros.get("hora_fin_lv", 1440)) # 1440 min = 24:00

        # Identificamos filas que contienen días de semana
        # Asumimos que la columna 'Dias_Lista' es string tipo "['Lunes', 'Martes']"
        mask_es_lv = df_filtrado['Dias_Lista'].astype(str).str.contains(
            'Lunes|Martes|Miercoles|Jueves|Viernes', 
            case=False, 
            regex=True
        )

        # LÓGICA:
        # Mantenemos la fila SI:
        # (NO es día de semana) O (ES día de semana Y cumple el horario)
        condicion_tiempo_lv = (
            (df_filtrado['Inicio_Min'] >= h_inicio_lv) & 
            (df_filtrado['Final_Min'] <= h_fin_lv)
        )
        
        df_filtrado = df_filtrado[ (~mask_es_lv) | (condicion_tiempo_lv) ]

        # Filtro hora sabado       
        h_inicio_sab = int(filtros.get("hora_inicio_sabado", 0))
        h_fin_sab = int(filtros.get("hora_fin_sabado", 1440))

        # Identificamos filas que son Sábado
        mask_es_sabado = df_filtrado['Dias_Lista'].astype(str).str.contains(
            'Sabado', 
            case=False
        )

        # LÓGICA:
        # Mantenemos la fila SI:
        # (NO es sábado) O (ES sábado Y cumple el horario)
        condicion_tiempo_sab = (
            (df_filtrado['Inicio_Min'] >= h_inicio_sab) & 
            (df_filtrado['Final_Min'] <= h_fin_sab)
        )

        df_filtrado = df_filtrado[ (~mask_es_sabado) | (condicion_tiempo_sab) ]

        # Filtro Catedratico
        busqueda_cat = filtros.get("catedratico", "").strip()
        
        if busqueda_cat:
            # BUSCAR (Mostrar solo los que coinciden) -> Lo más común en filtros
            df_filtrado = df_filtrado[
                df_filtrado['Catedratico'].str.contains(busqueda_cat, case=False, na=False)
            ]

        # Filtro Modalidad
        modalidad = filtros.get("modalidad", "TODAS").upper()
        
        if modalidad not in ["TODAS", "CUALQUIERA", ""]:
            # Se asegura que coincida (Presencial == PRESENCIAL)
            df_filtrado = df_filtrado[
                df_filtrado['Modalidad'].str.upper() == modalidad
            ]

        return df_filtrado

    def detectar_choque(self, horario1, horario2):
        try:
            dias1 = set(eval(str(horario1['Dias_Lista'])))
            dias2 = set(eval(str(horario2['Dias_Lista'])))
        except:
            return False 
        
        if not dias1.intersection(dias2):
            return False 
        
        return (horario1['Inicio_Min'] < horario2['Final_Min']) and \
               (horario2['Inicio_Min'] < horario1['Final_Min'])

    def calcular_fitness(self, cromosoma):
        puntaje = 1000
        for i in range(len(cromosoma)):
            for j in range(i + 1, len(cromosoma)):
                if self.detectar_choque(cromosoma[i], cromosoma[j]):
                    puntaje -= 500 
        return puntaje

    def generar(self, codigos_deseados, filtros=None, salario_meta=6000, disponibles_totales=None):
        # 1. Filtrar solo los cursos solicitados
        df_subset = self.df_oferta[self.df_oferta['Codigo'].isin(codigos_deseados)]
        
        # 2. Aplicar Filtros Avanzados ANTES de generar combinaciones
        if filtros:
            df_subset = self.aplicar_filtros_avanzados(df_subset, filtros)
        
        # 3. Agrupar secciones válidas
        secciones_por_curso = []
        cursos_sin_oferta = []

        for cod in codigos_deseados:
            df_curso = df_subset[df_subset['Codigo'] == cod]
            
            if df_curso.empty:
                cursos_sin_oferta.append(cod)
                continue
                
            # Identificar componentes únicos (ej: Clase normal, Laboratorio)
            # para obligar al algoritmo a elegir uno de CADA tipo.
            tipos_materia = df_curso['Star'].unique()
            
            for tipo in tipos_materia:
                secciones_tipo = df_curso[df_curso['Star'] == tipo]
                if not secciones_tipo.empty:
                    secciones_por_curso.append(secciones_tipo.to_dict('records'))

        # Si algún curso se quedó sin secciones por los filtros, retornamos error
        if cursos_sin_oferta:
            print(f"Advertencia: Los cursos {cursos_sin_oferta} se quedaron sin secciones por los filtros.")
            return [] 
        
        # Para el análisis financiero, necesitamos saber qué cursos estaban "Disponibles"
        # En el caso CUSTOM, los "disponibles" son básicamente los desados (porque el usuario elije qué llevar)
        # O podríamos llamar al motor general para ver qué OTROS cursos podía llevar.
        # POR SIMPLICIDAD: Asumimos que los "disponibles" para el cálculo de oportunidad son:
        # los que está intentando meter + los que NO metió.
        # Pero dado que el usuario ELIJE los cursos, el análisis de "qué dejaste de llevar" se hace 
        # comparando (Cursos deseados) vs (Cursos realmente asignados en el horario).
        # Sin embargo, la logica de costo oportunidad es sobre cursos CRÍTICOS DEL PENSUM que no estás llevando.
        # Si el usuario NO seleccionó un curso crítico en 'codigos_deseados', la herramienta debería avisarle.
        
        # TRUCO: Analizaremos sobre TODA la oferta posible de esos códigos deseados.
        # Pero para ser útiles, pasaremos como 'disponibles_totales' los codigos_deseados.
        # SI el horario final NO incluye alguno de los deseados (por choque), ahí saltará la alerta.
        # ADEMÁS, si quisiéramos ser proactivos, deberíamos pasarle TODOS los disponibles reales del pensum,
        # pero 'motor_custom' no calcula prerrequisitos.
        # ASUMIREMOS que 'disponibles_totales' = codigos_deseados.

        # --- ALGORITMO GENÉTICO RAPIDO ---
        POBLACION_TAMANO = 60
        GENERACIONES = 20
        poblacion = []

        # Crear Población Inicial
        for _ in range(POBLACION_TAMANO):
            individuo = []
            for opciones in secciones_por_curso:
                if opciones:
                    individuo.append(random.choice(opciones))
            if len(individuo) == len(codigos_deseados): 
                poblacion.append(individuo)

        if not poblacion: return []

        # Evolución
        for _ in range(GENERACIONES):
            poblacion = sorted(poblacion, key=self.calcular_fitness, reverse=True)
            if self.calcular_fitness(poblacion[0]) == 1000: break
            
            sobrevivientes = poblacion[:POBLACION_TAMANO//2]
            hijos = []
            while len(hijos) < POBLACION_TAMANO - len(sobrevivientes):
                padre = random.choice(sobrevivientes)
                madre = random.choice(sobrevivientes)
                punto = len(padre) // 2
                hijo = padre[:punto] + madre[punto:]
                
                # Mutación leve
                if random.random() < 0.2:
                    idx = random.randint(0, len(hijo)-1)
                    opciones = secciones_por_curso[idx]
                    hijo[idx] = random.choice(opciones)
                hijos.append(hijo)
            poblacion = sobrevivientes + hijos

        # Retornar top resultados con análisis
        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        resultados_unicos = []
        vistos = set()
        
        finales = []
        
        for indiv in mejores:
            firma = tuple(sorted([c['Codigo']+c['Seccion'] for c in indiv]))
            if firma not in vistos and self.calcular_fitness(indiv) == 1000:
                
                # Análisis de costo (usando disponibles_totales si existe, sino lo que pidió)
                pool_analisis = disponibles_totales if disponibles_totales is not None else codigos_deseados
                
                analisis = self.analizador_financiero.analizar_costo_oportunidad(
                    indiv, 
                    pool_analisis, 
                    salario_meta
                )
                
                item_resultado = {
                    "horario": indiv,
                    "analisis_financiero": analisis
                }
                
                finales.append(item_resultado)
                vistos.add(firma)
                
            if len(finales) >= 5: break
            
        return finales