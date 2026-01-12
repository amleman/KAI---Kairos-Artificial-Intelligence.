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

    def generar(self, codigos_deseados, filtros, salario_meta=6500, disponibles_totales=None):
        """
        Genera horarios buscando explícitamente Clase Normal Y sus auxiliares (Lab, Dibujo, Practica)
        para asegurar que se cursen en conjunto según el reglamento.
        """
        # 1. Aplicar filtros generales al DataFrame completo
        df_filtrado = self.aplicar_filtros_avanzados(self.df_oferta, filtros)

        secciones_por_curso = []
        cursos_sin_oferta = []
        
        # Definimos los tipos auxiliares que acompañan a la clase normal
        # El orden no afecta, pero los buscamos todos por si acaso.
        tipos_auxiliares = ['laboratorio', 'dibujo', 'practica']

        for cod in codigos_deseados:
            # Filtrar el DataFrame solo para este código
            df_subset_codigo = df_filtrado[df_filtrado['Codigo'] == cod]

            # -----------------------------------------------------
            # PASO 1: Buscar la CLASE NORMAL (Base)
            # -----------------------------------------------------
            df_teoria = df_subset_codigo[df_subset_codigo['Star'] == 'Clase normal']
            
            has_teoria = False
            if not df_teoria.empty:
                secciones_por_curso.append(df_teoria.to_dict('records'))
                has_teoria = True
            
            # -----------------------------------------------------
            # PASO 2: Buscar AUXILIARES (Lab, Dibujo, Practica)
            # -----------------------------------------------------
            has_auxiliar = False
            for tipo in tipos_auxiliares:
                df_aux = df_subset_codigo[df_subset_codigo['Star'] == tipo]
                
                if not df_aux.empty:
                    # Si encontramos oferta para este tipo auxiliar, agregamos el slot
                    secciones_por_curso.append(df_aux.to_dict('records'))
                    has_auxiliar = True
                    # NOTA: No hacemos 'break' aquí por si existiera un caso raro 
                    # con Lab Y Practica a la vez, aunque indicaste que no sucede. 
                    # Si quieres forzar solo 1 auxiliar, podrías poner un break.

            # Validación: Si no se encontró NADA para el curso
            if not has_teoria and not has_auxiliar:
                cursos_sin_oferta.append(cod)

        # Si no hay cursos válidos para armar un horario, retornar vacío
        if not secciones_por_curso:
            return []

        # ---------------------------------------------------------
        # INICIO DEL ALGORITMO GENÉTICO (Sin cambios en la lógica núcleo)
        # ---------------------------------------------------------
        poblacion_tam = 50
        generaciones = 20  
        poblacion = []

        # Generar población inicial
        for _ in range(poblacion_tam):
            individuo = []
            for opciones in secciones_por_curso:
                if opciones:
                    individuo.append(random.choice(opciones))
            poblacion.append(individuo)

        # Evolución
        for _ in range(generaciones):
            poblacion = sorted(poblacion, key=self.calcular_fitness, reverse=True)
            sobrevivientes = poblacion[:10]
            
            hijos = []
            while len(hijos) < (poblacion_tam - 10):
                padre1 = random.choice(sobrevivientes)
                padre2 = random.choice(sobrevivientes)
                
                punto_cruce = random.randint(0, len(padre1)-1)
                hijo = padre1[:punto_cruce] + padre2[punto_cruce:]
                
                if random.random() < 0.2:
                    idx = random.randint(0, len(hijo)-1)
                    opciones_disponibles = secciones_por_curso[idx]
                    hijo[idx] = random.choice(opciones_disponibles)
                
                hijos.append(hijo)
            
            poblacion = sobrevivientes + hijos

        # ---------------------------------------------------------
        # SELECCIÓN FINAL
        # ---------------------------------------------------------
        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        vistos = set()
        finales = []

        for indiv in mejores:
            # Firma única: Codigo + Seccion + Tipo(Star)
            firma = tuple(sorted([c['Codigo'] + c['Seccion'] + c['Star'] for c in indiv]))
            
            if firma not in vistos and self.calcular_fitness(indiv) >= 1000:
                
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
            
            if len(finales) >= 5: 
                break
        
        return finales