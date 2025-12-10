# motor_generador.py
# Clase GeneradorHorarios adaptada. Colocar en backend/

import pandas as pd
import random

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
        puntaje = 1000
        for i in range(len(cromosoma)):
            for j in range(i+1, len(cromosoma)):
                if self.detectar_choque(cromosoma[i], cromosoma[j]):
                    puntaje -= 500
        return puntaje

    def generar(self, cursos_ganados):
        codigos_posibles = self.obtener_disponibles(cursos_ganados)
        if not codigos_posibles:
            return []
        codigos_meta = codigos_posibles[:6]
        secciones_por_curso = []
        for cod in codigos_meta:
            secciones = self.df_oferta[self.df_oferta['Codigo'] == cod]
            if not secciones.empty:
                secciones_por_curso.append(secciones.to_dict('records'))
        if not secciones_por_curso:
            return []

        # Algoritmo genético simplificado
        POBLACION_TAMANO = 40
        GENERACIONES = 20
        poblacion = []
        for _ in range(POBLACION_TAMANO):
            individuo = []
            for lista in secciones_por_curso:
                if lista:
                    individuo.append(random.choice(lista))
            if individuo:
                poblacion.append(individuo)

        for gen in range(GENERACIONES):
            poblacion = sorted(poblacion, key=self.calcular_fitness, reverse=True)
            if poblacion and self.calcular_fitness(poblacion[0]) == 1000:
                break
            sobrevivientes = poblacion[:len(poblacion)//2]
            hijos = []
            while len(hijos) < POBLACION_TAMANO - len(sobrevivientes):
                padre = random.choice(sobrevivientes)
                madre = random.choice(sobrevivientes)
                punto = len(padre)//2
                hijo = padre[:punto] + madre[punto:]
                if random.random() < 0.1:
                    idx = random.randint(0, len(hijo)-1)
                    opciones = secciones_por_curso[idx]
                    if opciones:
                        hijo[idx] = random.choice(opciones)
                hijos.append(hijo)
            poblacion = sobrevivientes + hijos

        mejores = sorted(poblacion, key=self.calcular_fitness, reverse=True)
        resultados_unicos = []
        firmas_vistas = set()
        for indiv in mejores:
            firma = tuple(sorted([c.get('Codigo','') + str(c.get('Seccion','')) for c in indiv]))
            if firma not in firmas_vistas and self.calcular_fitness(indiv) == 1000:
                resultados_unicos.append(indiv)
                firmas_vistas.add(firma)
            if len(resultados_unicos) >= 4:
                break
        return resultados_unicos
