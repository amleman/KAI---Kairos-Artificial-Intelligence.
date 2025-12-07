import pandas as pd
import random
import numpy as np

class GeneradorHorarioCustom:
    def __init__(self, path_oferta):
        # Cargar oferta y limpiar NaNs
        self.df_oferta = pd.read_csv(path_oferta, dtype=str).fillna("")
        
        # Convertir horas a enteros (minutos) para comparaciones matemáticas
        self.df_oferta['Inicio_Min'] = pd.to_numeric(self.df_oferta['Inicio_Min'], errors='coerce').fillna(0).astype(int)
        self.df_oferta['Final_Min'] = pd.to_numeric(self.df_oferta['Final_Min'], errors='coerce').fillna(0).astype(int)

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

    def generar(self, codigos_deseados, filtros=None):
        # 1. Filtrar solo los cursos solicitados
        df_subset = self.df_oferta[self.df_oferta['Codigo'].isin(codigos_deseados)]
        
        # 2. Aplicar Filtros Avanzados ANTES de generar combinaciones
        if filtros:
            df_subset = self.aplicar_filtros_avanzados(df_subset, filtros)
        
        # 3. Agrupar secciones válidas
        secciones_por_curso = []
        cursos_sin_oferta = []

        for cod in codigos_deseados:
            secciones = df_subset[df_subset['Codigo'] == cod]
            if not secciones.empty:
                secciones_por_curso.append(secciones.to_dict('records'))
            else:
                cursos_sin_oferta.append(cod)

        # Si algún curso se quedó sin secciones por los filtros, retornamos error
        if cursos_sin_oferta:
            print(f"Advertencia: Los cursos {cursos_sin_oferta} se quedaron sin secciones por los filtros.")
            return [] 

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

        # Retornar top 3 únicos
        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        resultados_unicos = []
        vistos = set()
        
        for indiv in mejores:
            firma = tuple(sorted([c['Codigo']+c['Seccion'] for c in indiv]))
            if firma not in vistos and self.calcular_fitness(indiv) == 1000:
                resultados_unicos.append(indiv)
                vistos.add(firma)
            if len(resultados_unicos) >= 5: break
            
        return resultados_unicos