import pandas as pd
import random
import numpy as np

class GeneradorHorarios:
    def __init__(self, path_pensum, path_oferta):
        # 1. Cargar datos y evitar problemas de NaN
        self.df_pensum = pd.read_csv(path_pensum, dtype=str).fillna("")
        self.df_oferta = pd.read_csv(path_oferta, dtype=str).fillna("")
        
        # 2. Convertir horas a enteros para detectar choques
        # Si la columna viene vacía o con error, poner 0
        self.df_oferta['Inicio_Min'] = pd.to_numeric(self.df_oferta['Inicio_Min'], errors='coerce').fillna(0).astype(int)
        self.df_oferta['Final_Min'] = pd.to_numeric(self.df_oferta['Final_Min'], errors='coerce').fillna(0).astype(int)

    def obtener_disponibles(self, cursos_ganados):
        """
        Lógica Corregida:
        Retorna los cursos del pensum cuyos prerrequisitos estén TODOS en 'cursos_ganados',
        y que NO hayan sido ganados todavía.
        """
        disponibles = []
        
        # Convertimos la lista de entrada a set para búsqueda rápida
        set_ganados = set(cursos_ganados)

        print(f"DEBUG: Cursos ganados recibidos: {set_ganados}") # Para ver en consola

        for _, row in self.df_pensum.iterrows():
            codigo_curso = row['codigo'].strip()
            prerreqs_str = row['pre_requisitos'].strip()
            
            # 1. Si ya lo gané, NO sugerirlo (continuar al siguiente)
            if codigo_curso in set_ganados:
                continue
            
            # 2. Analizar prerrequisitos
            puede_llevar = False
            
            if not prerreqs_str or prerreqs_str.lower() == 'nan':
                # Caso A: No tiene prerrequisitos (ej. Primer semestre)
                # Siempre se puede llevar si no lo ha ganado
                puede_llevar = True
            else:
                # Caso B: Tiene prerrequisitos (ej. "0103, 0147")
                # Limpiamos comillas y espacios
                lista_reqs = [p.strip() for p in prerreqs_str.replace('"', '').split(',')]
                
                # Verificar si TODOS los requisitos están en set_ganados
                # all() devuelve True solo si se cumplen todos
                if all(req in set_ganados for req in lista_reqs):
                    puede_llevar = True
            
            if puede_llevar:
                # OJO: Solo agregamos si EXISTE oferta académica para ese curso
                # Si el pensum dice que puedes llevar "Arte", pero no hay horarios este semestre, no sirve de nada.
                if not self.df_oferta[self.df_oferta['Codigo'] == codigo_curso].empty:
                    disponibles.append(codigo_curso)
        
        print(f"DEBUG: Cursos disponibles detectados: {disponibles}") # Para ver en consola
        return disponibles

    def detectar_choque(self, horario1, horario2):
        """ Retorna True si hay choque de horario """
        # Validación de seguridad por si Dias_Lista viene corrupto
        try:
            dias1 = set(eval(str(horario1['Dias_Lista'])))
            dias2 = set(eval(str(horario2['Dias_Lista'])))
        except:
            return False 

        # Si no comparten días, no hay choque
        if not dias1.intersection(dias2):
            return False 
        
        # Si comparten días, verificar horas
        # (Inicio1 < Final2) y (Inicio2 < Final1)
        return (horario1['Inicio_Min'] < horario2['Final_Min']) and \
               (horario2['Inicio_Min'] < horario1['Final_Min'])

    def calcular_fitness(self, cromosoma):
        """ Función de Aptitud (Fitness) """
        puntaje = 1000
        
        # 1. Penalizar Choques
        for i in range(len(cromosoma)):
            for j in range(i + 1, len(cromosoma)):
                if self.detectar_choque(cromosoma[i], cromosoma[j]):
                    puntaje -= 500 # Penalización grave
        
        return puntaje

    def generar(self, cursos_ganados):
        # 1. Obtener qué cursos puede llevar realmente
        codigos_posibles = self.obtener_disponibles(cursos_ganados)
        
        if not codigos_posibles:
            return [] # No hay cursos disponibles para llevar
            
        # 2. Selección de Cursos para el Horario
        # Por ahora intentamos armar horario con TODOS los disponibles
        # (Si son demasiados, el algoritmo podría tardar, podrías limitar a 5 o 6)
        codigos_meta = codigos_posibles[:6] # Tomamos máximo 6 cursos sugeridos
        
        # 3. Buscar Secciones (Oferta)
        secciones_por_curso = []
        for cod in codigos_meta:
            secciones = self.df_oferta[self.df_oferta['Codigo'] == cod]
            if not secciones.empty:
                secciones_por_curso.append(secciones.to_dict('records'))
        
        if not secciones_por_curso:
            return []

        # --- ALGORITMO GENÉTICO ---
        POBLACION_TAMANO = 50
        GENERACIONES = 30 # Subimos un poco las generaciones
        poblacion = []

        # A. Crear Población Inicial
        for _ in range(POBLACION_TAMANO):
            individuo = []
            for lista_secciones in secciones_por_curso:
                if lista_secciones:
                    individuo.append(random.choice(lista_secciones))
            if individuo:
                poblacion.append(individuo)

        # B. Ciclo Evolutivo
        for gen in range(GENERACIONES):
            # Ordenar (Mejores primero)
            poblacion = sorted(poblacion, key=self.calcular_fitness, reverse=True)
            
            # Si ya tenemos uno perfecto, salimos
            if self.calcular_fitness(poblacion[0]) == 1000:
                break
            
            sobrevivientes = poblacion[:POBLACION_TAMANO//2]
            hijos = []
            
            # Cruce y Mutación
            while len(hijos) < POBLACION_TAMANO - len(sobrevivientes):
                padre = random.choice(sobrevivientes)
                madre = random.choice(sobrevivientes)
                
                # Cruce de un punto
                punto = len(padre) // 2
                hijo = padre[:punto] + madre[punto:]
                
                # Mutación (10%)
                if random.random() < 0.1:
                    idx = random.randint(0, len(hijo)-1)
                    opciones = secciones_por_curso[idx]
                    if opciones:
                        hijo[idx] = random.choice(opciones)
                
                hijos.append(hijo)
            
            poblacion = sobrevivientes + hijos

        # C. Resultado Final (Top 3 únicos sin choques)
        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        resultados_unicos = []
        firmas_vistas = set()
        
        for indiv in mejores:
            # Crear firma única para no repetir horarios idénticos
            firma = tuple(sorted([c['Codigo'] + c['Seccion'] for c in indiv]))
            
            if firma not in firmas_vistas and self.calcular_fitness(indiv) == 1000:
                resultados_unicos.append(indiv)
                firmas_vistas.add(firma)
                
            if len(resultados_unicos) >= 3:
                break
        
        return resultados_unicos