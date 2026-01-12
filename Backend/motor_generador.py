import pandas as pd
import random
import copy
from financiero import AnalizadorFinanciero
# IMPORTACIÓN DEL MÓDULO DE INTELIGENCIA
from clustering_semaforo import AnalizadorCargaAcademica

# -------------------------------------------------------------------------
# CACHÉ GLOBAL (Singleton Pattern para Cloud Run)
# -------------------------------------------------------------------------
# Aquí guardaremos las instancias de los analizadores ya entrenados.
# Clave: path del pensum, Valor: Objeto AnalizadorCargaAcademica
_CACHE_ANALIZADORES = {}

class GeneradorHorarios:
    def __init__(self, path_pensum, path_oferta):
        # 1. Carga de datos
        self.df_pensum = pd.read_csv(path_pensum, dtype=str).fillna("")
        # Normalizar nombres de columnas (algunos CSV tienen 'codigo', otros 'Codigo')
        self.df_pensum.rename(columns={'codigo': 'Codigo', 'pre_requisitos': 'Prerrequisito'}, inplace=True)
        try:
            self.df_oferta = pd.read_csv(path_oferta, dtype=str).fillna("")
        except Exception:
            self.df_oferta = pd.DataFrame()

        # Limpieza de tipos de datos
        cols_num = ['Inicio_Min', 'Final_Min']
        for col in cols_num:
            if col in self.df_oferta.columns:
                self.df_oferta[col] = pd.to_numeric(self.df_oferta[col], errors='coerce').fillna(0).astype(int)

        self.analizador_financiero = AnalizadorFinanciero(path_pensum)
        
        # 2. Inicializar IA de Dificultad (OPTIMIZADO)
        # Verificamos si ya tenemos un cerebro entrenado para este pensum en la memoria
        global _CACHE_ANALIZADORES
        
        if path_pensum in _CACHE_ANALIZADORES:
            # ¡Ya existe! Usamos el de la memoria (0 milisegundos)
            self.analizador_carga = _CACHE_ANALIZADORES[path_pensum]
            # print(f"Usando modelo en caché para: {path_pensum}") # Debug
        else:
            # No existe (primera vez que arranca el server o nuevo pensum)
            try:
                print(f"Entrenando modelo K-Means por primera vez para: {path_pensum}...")
                nuevo_analizador = AnalizadorCargaAcademica(path_pensum)
                _CACHE_ANALIZADORES[path_pensum] = nuevo_analizador
                self.analizador_carga = nuevo_analizador
                print("Modelo entrenado y guardado en caché.")
            except Exception as e:
                print(f"Advertencia: No se pudo cargar el módulo de Clustering: {e}")
                self.analizador_carga = None

        # 3. Pre-cálculo de Pesos Estratégicos (Grafo de dependencias)
        self.mapa_pesos = self._calcular_pesos_estrategicos()

    def _calcular_pesos_estrategicos(self):
        """Calcula cuántos cursos futuros dependen de cada curso."""
        pesos = {}
        # Optimizacion: crear dict de dependencias directo
        dependencias = {row['Codigo']: [] for _, row in self.df_pensum.iterrows()}
        
        # Parsear prerequisitos
        for _, row in self.df_pensum.iterrows():
            prereqs_raw = str(row['Prerrequisito'])
            if not prereqs_raw or prereqs_raw.lower() == 'ninguno': continue
            
            # Ajustar separadores comunes
            prereqs = prereqs_raw.replace(',', ';').split(';')
            
            curso_actual = row['Codigo']
            for p in prereqs:
                p_clean = p.strip()
                if p_clean in dependencias:
                    dependencias[p_clean].append(curso_actual)
        
        memo = {}
        def contar_profundidad(codigo):
            if codigo in memo: return memo[codigo]
            count = 0
            if codigo in dependencias:
                directos = dependencias[codigo]
                # Peso simple: 1 punto por cada curso que se desbloquea directa o indirectamente
                count = len(directos) 
                for hijo in directos:
                    count += contar_profundidad(hijo)
            memo[codigo] = count
            return count

        for codigo in self.df_pensum['Codigo'].unique():
            pesos[codigo] = contar_profundidad(codigo)
        return pesos

    def obtener_disponibles(self, aprobados):
        disponibles = []
        aprobados_set = set(aprobados)
        
        for _, row in self.df_pensum.iterrows():
            codigo = row['Codigo']
            if codigo in aprobados_set: continue
            
            prereqs_raw = str(row['Prerrequisito'])
            cumple = True
            
            if prereqs_raw and prereqs_raw.lower() not in ["ninguno", "nan", ""]:
                prereqs = [p.strip() for p in prereqs_raw.replace(',', ';').split(';') if p.strip()]
                for p in prereqs:
                    # Si es numérico (código de curso) y no está aprobado
                    if p.isdigit() and p not in aprobados_set:
                        cumple = False
                        break
                    # Aquí podrías agregar lógica para "100 creditos", etc.
            
            if cumple:
                disponibles.append(codigo)
        
        # Ordenar: Los que abren más cursos van primero
        disponibles.sort(key=lambda x: self.mapa_pesos.get(x, 0), reverse=True)
        return disponibles

    def detectar_choque(self, curso_a, curso_b):
        # Conversión segura de string de lista a lista real
        dias_a = eval(curso_a['Dias']) if isinstance(curso_a['Dias'], str) else curso_a['Dias']
        dias_b = eval(curso_b['Dias']) if isinstance(curso_b['Dias'], str) else curso_b['Dias']
        
        # Verificar intersección de días
        dias_comunes = False
        for d1, d2 in zip(dias_a, dias_b):
            if d1 is not None and d2 is not None:
                dias_comunes = True
                break
        
        if not dias_comunes: return False

        # Si coinciden días, verificar horas
        ini_a, fin_a = int(curso_a['Inicio_Min']), int(curso_a['Final_Min'])
        ini_b, fin_b = int(curso_b['Inicio_Min']), int(curso_b['Final_Min'])
        
        # Lógica de solapamiento: (StartA < EndB) and (StartB < EndA)
        return max(ini_a, ini_b) < min(fin_a, fin_b)

    def generar(self, aprobados, salario_meta=6500, config_trabajo=None, limite_cursos=6, preferencias={}):
        """
        Genera horarios inteligentes.
        """
        try:
            codigos_candidatos = self.obtener_disponibles(aprobados)
            # Tomamos los top X cursos más importantes para armar el pool
            codigos_pool = codigos_candidatos[:min(len(codigos_candidatos), 20)]

            perfil_usuario = preferencias.get('perfil', 'normal')

            # ---------------------------------------------------------
            # FASE 1: CONSTRUCCIÓN DE PAQUETES (Clase + Auxiliares)
            # ---------------------------------------------------------
            pool_paquetes = []
            tipos_auxiliares = ['laboratorio', 'dibujo', 'practica']
            
            # Filtro de Trabajo
            df_base = self.df_oferta
            if config_trabajo and config_trabajo.get('trabaja'):
                t_ini = config_trabajo['inicioMin']
                t_fin = config_trabajo['finMin']
                # Mantener solo cursos que terminen antes de trabajar o empiecen después
                df_base = df_base[(df_base['Final_Min'] <= t_ini) | (df_base['Inicio_Min'] >= t_fin)]

            for cod in codigos_pool:
                df_subset = df_base[df_base['Codigo'] == cod]
                if df_subset.empty: continue

                df_teoria = df_subset[df_subset['Star'] == 'Clase normal']
                opciones_teoria = df_teoria.to_dict('records')
                
                opciones_aux = []
                for tipo in tipos_auxiliares:
                    df_aux = df_subset[df_subset['Star'] == tipo]
                    if not df_aux.empty:
                        opciones_aux.extend(df_aux.to_dict('records'))

                paquetes_curso = []
                # Combinatoria: Teoría x Auxiliar
                if opciones_teoria and opciones_aux:
                    for t in opciones_teoria:
                        for a in opciones_aux:
                            if not self.detectar_choque(t, a):
                                paquetes_curso.append([t, a])
                elif opciones_teoria:
                    for t in opciones_teoria: paquetes_curso.append([t])
                elif opciones_aux:
                    # Caso raro: curso que solo es práctica
                    for a in opciones_aux: paquetes_curso.append([a])

                if paquetes_curso:
                    # Añadir opción de NO llevar el curso
                    paquetes_curso.append(None)
                    
                    # Obtener info de IA para este curso
                    nivel_dificultad = 2
                    if self.analizador_carga:
                        info = self.analizador_carga.obtener_nivel_curso(cod)
                        if info: nivel_dificultad = info['nivel']
                    
                    peso_estrategico = self.mapa_pesos.get(cod, 0)
                    
                    pool_paquetes.append((cod, peso_estrategico, paquetes_curso, nivel_dificultad))

            if not pool_paquetes: return []

            # ---------------------------------------------------------
            # FASE 2: ALGORITMO GENÉTICO
            # ---------------------------------------------------------
            poblacion_tam = 70
            generaciones = 30
            poblacion = []

            # Inicialización
            for _ in range(poblacion_tam):
                individuo = []
                for cod, peso, paquetes, nivel in pool_paquetes:
                    # Probabilidad heurística
                    prob_tomar = 0.6
                    if perfil_usuario == 'relax' and nivel == 3: prob_tomar = 0.3
                    
                    if random.random() < prob_tomar:
                        eleccion = random.choice(paquetes)
                    else:
                        eleccion = None 
                    individuo.append(eleccion)
                poblacion.append(individuo)

            def calcular_fitness(indiv):
                horario_flat = []
                cursos_tomados = 0
                peso_estrategico_total = 0
                niveles = {1:0, 2:0, 3:0} # Contadores de dificultad

                for i, paquete in enumerate(indiv):
                    if paquete is not None:
                        horario_flat.extend(paquete)
                        cursos_tomados += 1
                        
                        datos = pool_paquetes[i]
                        peso_estrategico_total += datos[1]
                        niveles[datos[3]] += 1

                # Validar choques
                choques = 0
                for k in range(len(horario_flat)):
                    for j in range(k+1, len(horario_flat)):
                        if self.detectar_choque(horario_flat[k], horario_flat[j]):
                            choques += 1
                if choques > 0: return 0 

                # Validar límite cursos
                if cursos_tomados > limite_cursos: return 10 

                # Puntaje base
                score = 1000 
                score += (cursos_tomados * 60) # Prioridad llenar cupo
                score += (peso_estrategico_total * 15) # Prioridad cursos clave

                # IA: Ajuste por Perfil
                rojos = niveles[3]
                verdes = niveles[1]
                
                if perfil_usuario == 'relax':
                    if rojos > 1: score -= 300
                    if rojos == 0: score += 100
                elif perfil_usuario == 'normal':
                    if rojos > 2: score -= 200
                    if rojos > 0 and verdes >= rojos: score += 50
                elif perfil_usuario == 'tryhard':
                    if rojos > 4: score -= 100
                    score += (peso_estrategico_total * 10) # Boost extra a avanzar rápido

                return score

            # Ciclo Evolutivo
            for _ in range(generaciones):
                poblacion.sort(key=calcular_fitness, reverse=True)
                sobrevivientes = poblacion[:15]
                
                hijos = []
                while len(hijos) < (poblacion_tam - 15):
                    padre1 = random.choice(sobrevivientes)
                    padre2 = random.choice(sobrevivientes)
                    punto = random.randint(0, len(padre1)-1)
                    
                    hijo = padre1[:punto] + padre2[punto:]
                    
                    # Mutación
                    if random.random() < 0.25:
                        idx = random.randint(0, len(hijo)-1)
                        hijo[idx] = random.choice(pool_paquetes[idx][2])
                    hijos.append(hijo)
                poblacion = sobrevivientes + hijos

            # Selección final
            mejores = sorted(poblacion, key=calcular_fitness, reverse=True)
            finales = []
            firmas = set()

            for indiv in mejores:
                fit = calcular_fitness(indiv)
                if fit < 100: continue
                
                horario_flat = []
                lista_codigos = []
                for i, p in enumerate(indiv):
                    if p: 
                        horario_flat.extend(p)
                        lista_codigos.append(pool_paquetes[i][0])
                
                if not horario_flat: continue

                try:
                    firma = tuple(sorted([c['Codigo']+c['Seccion'] for c in horario_flat]))
                except KeyError as e:
                    print(f"\n[ERROR CRÍTICO] Objeto malformado en horario_flat:")
                    for idx, bad_c in enumerate(horario_flat):
                        print(f"  Ítem {idx}: {bad_c} (Tipo: {type(bad_c)})")
                        if isinstance(bad_c, dict):
                            print(f"    - Keys: {list(bad_c.keys())}")
                    raise e

                if firma not in firmas:
                    analisis_fin = self.analizador_financiero.analizar_costo_oportunidad(
                        horario_flat, codigos_pool, salario_meta
                    )
                    
                    analisis_carga = None
                    if self.analizador_carga:
                        analisis_carga = self.analizador_carga.analizar_seleccion(lista_codigos)

                    finales.append({
                        "horario": horario_flat,
                        "analisis_financiero": analisis_fin,
                        "analisis_carga": analisis_carga,
                        "score_ia": fit
                    })
                    firmas.add(firma)
                
                if len(finales) >= 5: break
                
            return finales

        except Exception as e:
            import traceback
            print(f"\n[ERROR FATAL EN GENERAR]: {e}")
            traceback.print_exc()
            raise e