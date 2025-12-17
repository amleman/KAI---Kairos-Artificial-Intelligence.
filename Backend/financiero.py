
import pandas as pd

class AnalizadorFinanciero:
    def __init__(self, path_pensum):
        self.df_pensum = pd.read_csv(path_pensum, dtype=str).fillna("")
        self.grafo = {}
        self.pesos = {}
        self.nombres = {}
        self._construir_grafo()
        self._precalcular_pesos()

    def _construir_grafo(self):
        """Construye el mapa de dependencias (quién desbloquea a quién)."""
        for _, row in self.df_pensum.iterrows():
            codigo = str(row['codigo']).strip()
            self.nombres[codigo] = row.get('nombre_completo', row.get('nombre', codigo))
            
            prerreqs_raw = str(row.get('pre_requisitos', ''))
            # Limpieza: quitar comillas, espacios y dividir
            prerreqs = [p.strip() for p in prerreqs_raw.replace(';', ',').replace('"', '').split(',') if p.strip()]
            
            for p in prerreqs:
                if p not in self.grafo:
                    self.grafo[p] = []
                self.grafo[p].append(codigo)

    def _calcular_peso_recursivo(self, codigo, cache):
        """Calcula cuántos cursos se desbloquean (directa o indirectamente)"""
        if codigo in cache: return cache[codigo]
        if codigo not in self.grafo: 
            cache[codigo] = 0
            return 0
        
        peso = 0
        for hijo in self.grafo[codigo]:
            # 1 (el hijo mismo) + lo que el hijo desbloquea
            peso += 1 + self._calcular_peso_recursivo(hijo, cache)
        
        cache[codigo] = peso
        return peso

    def _precalcular_pesos(self):
        """Asigna un valor de 'importancia' a cada curso."""
        # Obtenemos todos los códigos únicos que son prerrequisitos de algo
        todos_codigos = list(self.grafo.keys())
        cache_local = {}
        for cod in todos_codigos:
            self.pesos[cod] = self._calcular_peso_recursivo(cod, cache_local)

    def analizar_costo_oportunidad(self, horario_generado, disponibles_totales, salario_meta):
        """
        Analiza si el estudiante está dejando cursos críticos sobre la mesa.
        
        Args:
            horario_generado: Lista de dicts con los cursos elegidos por la IA.
            disponibles_totales: Lista de códigos (str) que el estudiante PODÍA llevar.
            salario_meta: Expectativa salarial mensual.
        """
        # 1. ¿Qué cursos decidió tomar la IA?
        codigos_tomados = set([str(c.get('Codigo', '')).strip() for c in horario_generado])
        
        # 2. ¿Qué cursos dejó por fuera?
        cursos_ignorados = [c for c in disponibles_totales if c not in codigos_tomados]
        
        atraso_meses = 0
        criticos_dejados = []

        # 3. Análisis de impacto
        for codigo in cursos_ignorados:
            # Peso = Cuántos cursos futuros dependen de este
            peso = self.pesos.get(codigo, 0)
            
            # UMBRAL DE CRITICIDAD (Ajustable):
            # Si un curso desbloquea 5+ cursos futuros, es un "Cuello de botella"
            if peso >= 5:
                # Verificar si ya penalizamos por algo similar para no sumar infinito
                # (Simplificación: asumimos que dejar un critico retrasa 1 semestre)
                criticos_dejados.append({
                    "codigo": codigo,
                    "nombre": self.nombres.get(codigo, codigo),
                    "impacto": peso # Cuántos cursos bloquea
                })

        # Si dejó cursos críticos, asumimos retraso.
        # En un hackathon, simplificamos: Si hay críticos olvidados -> +6 meses.
        if criticos_dejados:
            # Ordenamos para mostrar el más grave primero
            criticos_dejados.sort(key=lambda x: x['impacto'], reverse=True)
            atraso_meses = 6 
        
        costo_proyectado = atraso_meses * float(salario_meta)
        
        mensaje = "Ruta Financiera Óptima."
        tipo_alerta = "success" # green

        if costo_proyectado > 0:
            top_curso = criticos_dejados[0]['nombre']
            mensaje = f"ALERTA ECONÓMICA: No asignar '{top_curso}' podría retrasar tu cierre 1 semestre."
            tipo_alerta = "danger" # red

        return {
            "costo_proyectado_total": costo_proyectado,
            "meses_atraso_estimado": atraso_meses,
            "cursos_criticos_ignorados": criticos_dejados,
            "mensaje_alerta": mensaje,
            "tipo_alerta": tipo_alerta,
            "salario_base_calculo": salario_meta
        }
