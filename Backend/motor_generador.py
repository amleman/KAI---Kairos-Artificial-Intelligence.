# motor_generador.py
# Clase GeneradorHorarios adaptada. Colocar en backend/

import pandas as pd
import random

from financiero import AnalizadorFinanciero

class GeneradorHorarios:
    def __init__(self, path_pensum, path_oferta):
        self.df_pensum = pd.read_csv(path_pensum, dtype=str).fillna("")
        # Si oferta falta, creamos df_oferta a partir del pensum (soporte para pruebas)
        try:
            self.df_oferta = pd.read_csv(path_oferta, dtype=str).fillna("")
        except Exception:
            self.df_oferta = pd.DataFrame(columns=['Codigo','Seccion','Inicio_Min','Final_Min','Dias_Lista','Inicio','Final','Nombre_Limpio'])

        # Asegurar columnas numéricas para evitar errores
        if 'Inicio_Min' not in self.df_oferta.columns:
            self.df_oferta['Inicio_Min'] = 0
        if 'Final_Min' not in self.df_oferta.columns:
            self.df_oferta['Final_Min'] = 0
        self.df_oferta['Inicio_Min'] = pd.to_numeric(self.df_oferta['Inicio_Min'], errors='coerce').fillna(0).astype(int)
        self.df_oferta['Final_Min'] = pd.to_numeric(self.df_oferta['Final_Min'], errors='coerce').fillna(0).astype(int)

        # Inicializar Analizador Financiero
        self.analizador_financiero = AnalizadorFinanciero(path_pensum)

    def obtener_disponibles(self, cursos_ganados):
        disponibles = []
        set_ganados = set(cursos_ganados)
        for _, row in self.df_pensum.iterrows():
            codigo_curso = row['codigo'].strip()
            prerreqs_str = str(row.get('pre_requisitos','')).strip()
            if codigo_curso in set_ganados:
                continue
            puede_llevar = False
            if not prerreqs_str or prerreqs_str.lower() == 'nan':
                puede_llevar = True
            else:
                lista_reqs = [p.strip() for p in prerreqs_str.replace('"','').split(',') if p.strip()]
                if all(req in set_ganados for req in lista_reqs):
                    puede_llevar = True
            if puede_llevar:
                # sólo si hay oferta (o lo añadimos de todos modos)
                if not self.df_oferta[self.df_oferta['Codigo'] == codigo_curso].empty:
                    disponibles.append(codigo_curso)
        return disponibles

    def detectar_choque(self, horario1, horario2):
        if not horario1 or not horario2:
            return False
        try:
            dias1 = set(eval(str(horario1.get('Dias_Lista', '[]'))))
            dias2 = set(eval(str(horario2.get('Dias_Lista', '[]'))))
        except Exception:
            return False
        if not dias1.intersection(dias2):
            return False
        return (int(horario1.get('Inicio_Min',0)) < int(horario2.get('Final_Min',0))) and \
               (int(horario2.get('Inicio_Min',0)) < int(horario1.get('Final_Min',0)))

    def calcular_fitness(self, cromosoma):
        # Base: 0
        # Recompensa: +10 pts por cada curso asignado (no None)
        # Penalización: -100 pts por cada choque
        puntaje = 0
        cursos_asignados = [c for c in cromosoma if c is not None]
        puntaje += len(cursos_asignados) * 10
        
        for i in range(len(cursos_asignados)):
            for j in range(i+1, len(cursos_asignados)):
                if self.detectar_choque(cursos_asignados[i], cursos_asignados[j]):
                    puntaje -= 100
        return puntaje

    def generar(self, cursos_ganados, salario_meta=6000, config_trabajo=None, limite_cursos=6):
        codigos_posibles = self.obtener_disponibles(cursos_ganados)
        if not codigos_posibles:
            return []
            
        # Ordenar cursos disponibles por "peso" (importancia en prerrequisitos)
        pesos_cursos = self.analizador_financiero.pesos
        codigos_posibles.sort(key=lambda c: pesos_cursos.get(c, 0), reverse=True)
        
        # Seleccionar candidatos: Límite + margen para flexibilidad
        top_n = limite_cursos + 3
        codigos_meta = codigos_posibles[:top_n]
        
        secciones_por_curso = []
        
        # FILTRADO POR HORARIO DE TRABAJO
        df_oferta_actual = self.df_oferta.copy()
        
        if config_trabajo and config_trabajo.get('trabaja'):
            trabajo_inicio_min = config_trabajo.get('inicioMin', 0)
            trabajo_fin_min = config_trabajo.get('finMin', 0)
            
            mask_sabado = df_oferta_actual['Dias_Lista'].str.contains('Sabado|Domingo', case=False, na=False)
            
            mask_choque = (
                (df_oferta_actual['Inicio_Min'] < trabajo_fin_min) & 
                (df_oferta_actual['Final_Min'] > trabajo_inicio_min)
            )
            
            mask_descartar = mask_choque & (~mask_sabado)
            
            df_oferta_actual = df_oferta_actual[~mask_descartar]

        for cod in codigos_meta:
            secciones = df_oferta_actual[df_oferta_actual['Codigo'] == cod]
            if not secciones.empty:
                secciones_por_curso.append(secciones.to_dict('records'))
            else:
                secciones_por_curso.append([])
                
        if not any(secciones_por_curso):
            return []

        # Algoritmo genético
        POBLACION_TAMANO = 60
        GENERACIONES = 30
        poblacion = []
        
        for _ in range(POBLACION_TAMANO):
            individuo = []
            for lista in secciones_por_curso:
                opciones = lista + [None]
                individuo.append(random.choice(opciones))
            if individuo:
                poblacion.append(individuo)

        for gen in range(GENERACIONES):
            poblacion = sorted(poblacion, key=self.calcular_fitness, reverse=True)
            
            sobrevivientes = poblacion[:len(poblacion)//2]
            hijos = []
            while len(hijos) < POBLACION_TAMANO - len(sobrevivientes):
                padre = random.choice(sobrevivientes)
                madre = random.choice(sobrevivientes)
                punto = len(padre)//2
                hijo = padre[:punto] + madre[punto:]
                
                if random.random() < 0.2:
                    idx = random.randint(0, len(hijo)-1)
                    opciones = secciones_por_curso[idx] + [None]
                    hijo[idx] = random.choice(opciones)
                hijos.append(hijo)
            poblacion = sobrevivientes + hijos

        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        firmas_vistas = set()
        finales = []
        
        def tiene_choques(h):
            for i in range(len(h)):
                for j in range(i+1, len(h)):
                    if self.detectar_choque(h[i], h[j]): return True
            return False
            
        for indiv in mejores:
            horario_limpio = [c for c in indiv if c is not None]
            
            # FILTRO CRÍTICO: Respetar estrictamente el límite de cursos calculado
            if len(horario_limpio) > limite_cursos:
                horario_limpio = horario_limpio[:limite_cursos]
            
            if not horario_limpio:
                continue
                
            firma = tuple(sorted([c.get('Codigo','') + str(c.get('Seccion','')) for c in horario_limpio]))
            
            if firma not in firmas_vistas and not tiene_choques(horario_limpio):
                analisis = self.analizador_financiero.analizar_costo_oportunidad(
                    horario_limpio, 
                    codigos_posibles, 
                    salario_meta
                )
                
                item_resultado = {
                    "horario": horario_limpio,
                    "analisis_financiero": analisis
                }
                
                finales.append(item_resultado)
                firmas_vistas.add(firma)
            
            if len(finales) >= 5:
                break
                
        return finales
