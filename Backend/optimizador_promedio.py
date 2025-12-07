# -----------------------------------------------------------
# OPTIMIZADOR DE PROMEDIO - MÓDULO GOAL SEEKING
# -----------------------------------------------------------

import pandas as pd
import numpy as np
from scipy.optimize import minimize, LinearConstraint
import warnings
warnings.filterwarnings('ignore')


class OptimizadorPromedio:
    # Calcula notas necesarias para alcanzar un promedio objetivo
    
    def __init__(self, path_pensum='Data/pensum_sistemas.csv'):
        self.df_pensum = pd.read_csv(path_pensum)
        # Crear diccionario de créditos por código de curso
        self.creditos_por_curso = {}
        for _, row in self.df_pensum.iterrows():
            # Convertir código a string con padding de 4 dígitos (ej: "0005")
            codigo = str(int(row['codigo'])).zfill(4)
            creditos = int(row['creditos']) if pd.notna(row['creditos']) else 3
            self.creditos_por_curso[codigo] = creditos
    
    def obtener_creditos(self, codigo):
        # Obtiene creditos de un curso (default 3)
        # Asegurar que el código tenga formato con padding de 4 dígitos
        codigo = str(codigo).strip()
        # Si el código es numérico, aplicar zfill(4)
        if codigo.isdigit():
            codigo = codigo.zfill(4)
        return self.creditos_por_curso.get(codigo, 3)  # Default 3 créditos
    
    def calcular_promedio_actual(self, cursos_aprobados):
        # Calcula promedio ponderado de cursos aprobados
        if not cursos_aprobados:
            return {
                'promedio': 0,
                'creditos_totales': 0,
                'puntos_totales': 0,
                'cursos_count': 0
            }
        
        puntos_totales = 0
        creditos_totales = 0
        
        for curso in cursos_aprobados:
            codigo = str(curso['codigo']).strip()
            nota = float(curso['nota'])
            creditos = self.obtener_creditos(codigo)
            
            puntos_totales += nota * creditos
            creditos_totales += creditos
        
        promedio = puntos_totales / creditos_totales if creditos_totales > 0 else 0
        
        return {
            'promedio': round(promedio, 2),
            'creditos_totales': creditos_totales,
            'puntos_totales': round(puntos_totales, 2),
            'cursos_count': len(cursos_aprobados)
        }
    
    def calcular_notas_necesarias(self, cursos_aprobados, cursos_actuales, promedio_objetivo):
        # Calcula notas necesarias para alcanzar el promedio objetivo
        # Validar promedio objetivo
        if promedio_objetivo < 0 or promedio_objetivo > 100:
            return {
                'factible': False,
                'mensaje': 'El promedio objetivo debe estar entre 0 y 100',
                'notas_necesarias': []
            }
        
        # Calcular estado actual
        estado_actual = self.calcular_promedio_actual(cursos_aprobados)
        promedio_actual = estado_actual['promedio']
        puntos_actuales = estado_actual['puntos_totales']
        creditos_actuales = estado_actual['creditos_totales']
        
        # Validar si hay cursos actuales
        if not cursos_actuales:
            return {
                'factible': False,
                'promedio_actual': promedio_actual,
                'promedio_objetivo': promedio_objetivo,
                'mensaje': 'No hay cursos actuales para calcular',
                'notas_necesarias': []
            }
        
        # Obtener créditos de cursos actuales
        creditos_nuevos = []
        for codigo in cursos_actuales:
            creditos = self.obtener_creditos(codigo)
            creditos_nuevos.append(creditos)
        
        total_creditos_nuevos = sum(creditos_nuevos)
        creditos_finales = creditos_actuales + total_creditos_nuevos
        
        # CÁLCULO SIMPLE: Solo usar promedio actual y objetivo
        # Fórmula: (promedio_actual + promedio_necesario) / 2 = promedio_objetivo
        # Entonces: promedio_necesario = 2 * promedio_objetivo - promedio_actual
        promedio_necesario_ideal = 2 * promedio_objetivo - promedio_actual
        
        # Para nota MÍNIMA: Restar un margen para que solo aproxime (no llegue exacto)
        promedio_necesario = promedio_necesario_ideal - 1
        
        # Caso 1: Ya superó el promedio objetivo
        if promedio_actual >= promedio_objetivo:
            # Calcular la nota mínima real necesaria para mantener el objetivo
            
            # Verificar si puede sacar 0 en todo y aún mantener el objetivo
            promedio_con_ceros = promedio_actual / 2
            
            if promedio_con_ceros >= promedio_objetivo:
                # Puede sacar 0 en todo y aún cumplir
                notas_necesarias = []
                for i, codigo in enumerate(cursos_actuales):
                    notas_necesarias.append({
                        'codigo': codigo,
                        'nota_minima': 0,
                        'creditos': creditos_nuevos[i],
                        'nota_sugerida': 61  # Aprobar con lo mínimo
                    })
                
                return {
                    'factible': True,
                    'promedio_actual': promedio_actual,
                    'promedio_objetivo': promedio_objetivo,
                    'mensaje': f'Tu promedio actual ({promedio_actual:.2f}) es muy superior al objetivo ({promedio_objetivo:.2f}). Puedes aprobar todos los cursos con nota mínima (61) y aún superarás tu meta.',
                    'notas_necesarias': notas_necesarias,
                    'estadisticas': {
                        'creditos_actuales': creditos_actuales,
                        'creditos_nuevos': total_creditos_nuevos,
                        'creditos_finales': creditos_finales,
                        'puntos_actuales': puntos_actuales
                    }
                }
            else:
                # Necesita calcular notas reales aunque su promedio actual sea mayor
                # Seguir con el flujo normal
                pass
        
        # Caso 2: Verificar si es factible (¿puede sacar 100 en todo?)
        promedio_maximo_posible = (promedio_actual + 100) / 2
        
        if promedio_maximo_posible < promedio_objetivo:
            return {
                'factible': False,
                'promedio_actual': promedio_actual,
                'promedio_objetivo': promedio_objetivo,
                'promedio_maximo_posible': round(promedio_maximo_posible, 2),
                'mensaje': f'NO ES FACTIBLE. Aunque saques 100 en todos los cursos actuales, solo alcanzarias {promedio_maximo_posible:.2f}. Considera un promedio objetivo mas realista.',
                'notas_necesarias': [],
                'estadisticas': {
                    'creditos_actuales': creditos_actuales,
                    'creditos_nuevos': total_creditos_nuevos,
                    'creditos_finales': creditos_finales,
                    'puntos_actuales': puntos_actuales
                }
            }
        
        # Caso 3: Calcular notas necesarias (SIMPLE - SIN créditos)
        
        # Subcaso especial: promedio actual == promedio objetivo
        if abs(promedio_actual - promedio_objetivo) < 0.01:
            notas_necesarias = []
            for i, codigo in enumerate(cursos_actuales):
                notas_necesarias.append({
                    'codigo': codigo,
                    'nota_minima': round(promedio_objetivo, 2),
                    'creditos': creditos_nuevos[i],
                    'nota_sugerida': round(promedio_objetivo, 2)
                })
            
            return {
                'factible': True,
                'promedio_actual': promedio_actual,
                'promedio_objetivo': promedio_objetivo,
                'nota_promedio_requerida': round(promedio_objetivo, 2),
                'mensaje': f'EQUILIBRIO PERFECTO: Tu promedio actual ya es {promedio_actual:.2f}. Solo necesitas sacar {promedio_objetivo:.2f} en todos los cursos actuales para mantenerlo.',
                'notas_necesarias': notas_necesarias,
                'estadisticas': {
                    'creditos_actuales': creditos_actuales,
                    'creditos_nuevos': total_creditos_nuevos,
                    'creditos_finales': creditos_finales,
                    'puntos_actuales': puntos_actuales,
                    'nivel_dificultad': 'EQUILIBRIO'
                }
            }
        
        # Asignar notas según créditos (cursos con MÁS créditos → notas MÁS BAJAS)
        notas_necesarias = []
        
        min_creditos = min(creditos_nuevos)
        max_creditos = max(creditos_nuevos)
        
        # Si todos tienen los mismos créditos, todos la misma nota
        if min_creditos == max_creditos:
            for i, codigo in enumerate(cursos_actuales):
                nota_minima = max(61, promedio_necesario)
                nota_sugerida = max(61, promedio_necesario_ideal)
                
                notas_necesarias.append({
                    'codigo': codigo,
                    'nota_minima': round(nota_minima, 2),
                    'creditos': creditos_nuevos[i],
                    'nota_sugerida': round(nota_sugerida, 2)
                })
        else:
            # Distribución con variación según créditos
            # Rango de diferencia: ajustar según la diferencia de créditos
            diferencia_creditos = max_creditos - min_creditos
            rango_variacion = min(15, diferencia_creditos * 2)  # Máximo 15 puntos de diferencia
            
            # Calcular notas para cada curso
            for i, codigo in enumerate(cursos_actuales):
                credito = creditos_nuevos[i]
                
                # Factor: 0 = menos créditos (fácil), 1 = más créditos (difícil)
                factor_dificultad = (credito - min_creditos) / diferencia_creditos
                
                # Ajuste: difícil (factor=1) → nota más baja
                #         fácil (factor=0) → nota más alta
                ajuste = rango_variacion * (0.5 - factor_dificultad)
                nota_calculada = promedio_necesario + ajuste
                
                # Limitar entre 61 y 100
                nota_calculada = max(61, min(100, nota_calculada))
                
                # Nota sugerida: misma lógica pero con promedio IDEAL
                nota_sugerida_calculada = promedio_necesario_ideal + ajuste
                nota_sugerida_calculada = max(61, min(100, nota_sugerida_calculada))
                
                notas_necesarias.append({
                    'codigo': codigo,
                    'nota_minima': round(nota_calculada, 2),
                    'creditos': credito,
                    'nota_sugerida': round(nota_sugerida_calculada, 2)
                })
            
            # VERIFICACIÓN: Ajustar para que el promedio aritmético sea exacto
            promedio_actual_notas = sum([n['nota_minima'] for n in notas_necesarias]) / len(notas_necesarias)
            diferencia = promedio_necesario - promedio_actual_notas
            
            # Si hay diferencia significativa, ajustar todas las notas
            if abs(diferencia) > 0.1:
                for nota in notas_necesarias:
                    nota_anterior = nota['nota_minima']
                    nota['nota_minima'] = round(max(61, min(100, nota['nota_minima'] + diferencia)), 2)
                    # Nota sugerida: NO aplicar diferencia, solo usar promedio ideal + ajuste
                    credito = nota['creditos']
                    factor_dificultad = (credito - min_creditos) / diferencia_creditos if diferencia_creditos > 0 else 0
                    ajuste = rango_variacion * (0.5 - factor_dificultad)
                    nota['nota_sugerida'] = round(max(61, min(100, promedio_necesario_ideal + ajuste)), 2)
        
        # Determinar mensaje según dificultad
        nota_promedio_requerida = promedio_necesario
        if nota_promedio_requerida < 70:
            nivel_dificultad = 'FACIL'
            consejo = 'Es muy alcanzable. Manten el enfoque.'
        elif nota_promedio_requerida < 80:
            nivel_dificultad = 'MODERADO'
            consejo = 'Requiere esfuerzo constante, pero es manejable.'
        elif nota_promedio_requerida < 90:
            nivel_dificultad = 'DIFICIL'
            consejo = 'Necesitaras dedicacion y tiempo de estudio significativo.'
        else:
            nivel_dificultad = 'MUY DIFICIL'
            consejo = 'Requiere excelencia en todos los cursos. Considera ajustar tu meta.'
        
        mensaje = f'{nivel_dificultad}: Necesitas un promedio de {nota_promedio_requerida:.2f} en tus cursos actuales. {consejo}'
        
        return {
            'factible': True,
            'promedio_actual': promedio_actual,
            'promedio_objetivo': promedio_objetivo,
            'nota_promedio_requerida': round(promedio_necesario, 2),
            'mensaje': mensaje,
            'notas_necesarias': notas_necesarias,
            'estadisticas': {
                'creditos_actuales': creditos_actuales,
                'creditos_nuevos': total_creditos_nuevos,
                'creditos_finales': creditos_finales,
                'puntos_actuales': puntos_actuales,
                'nivel_dificultad': nivel_dificultad
            }
        }
    
    def _optimizar_distribucion(self, creditos, puntos_necesarios):
        # Distribuye notas de forma equitativa usando optimizacion
        n = len(creditos)
        
        # Función objetivo: minimizar la suma de cuadrados (distribución equitativa)
        def objective(notas):
            return np.sum((notas - np.mean(notas))**2)
        
        # Restricción: la suma ponderada debe ser >= puntos_necesarios
        def constraint_sum(notas):
            return np.dot(notas, creditos) - puntos_necesarios
        
        # Límites: notas entre 61 (aprobar) y 100
        bounds = [(61, 100) for _ in range(n)]
        
        # Restricciones
        constraints = [
            {'type': 'ineq', 'fun': constraint_sum}
        ]
        
        # Valor inicial: distribución equitativa
        x0 = np.ones(n) * (puntos_necesarios / sum(creditos))
        x0 = np.clip(x0, 61, 100)
        
        # Optimizar
        result = minimize(
            objective, 
            x0, 
            method='SLSQP', 
            bounds=bounds, 
            constraints=constraints
        )
        
        if result.success:
            return result.x
        else:
            # Si falla, retornar distribución simple
            return x0
    
    def simular_escenarios(self, cursos_aprobados, cursos_actuales):
        # Simula escenarios: optimista, realista, pesimista, minimo
        estado_actual = self.calcular_promedio_actual(cursos_aprobados)
        
        # Obtener créditos de cursos actuales
        creditos_nuevos = [self.obtener_creditos(c) for c in cursos_actuales]
        total_creditos_nuevos = sum(creditos_nuevos)
        creditos_finales = estado_actual['creditos_totales'] + total_creditos_nuevos
        
        escenarios = []
        
        # Escenario 1: Pesimista (aprobar con 61)
        puntos_pesimista = estado_actual['puntos_totales'] + (61 * total_creditos_nuevos)
        promedio_pesimista = puntos_pesimista / creditos_finales
        
        # Escenario 2: Realista (promedio de 75)
        puntos_realista = estado_actual['puntos_totales'] + (75 * total_creditos_nuevos)
        promedio_realista = puntos_realista / creditos_finales
        
        # Escenario 3: Optimista (promedio de 90)
        puntos_optimista = estado_actual['puntos_totales'] + (90 * total_creditos_nuevos)
        promedio_optimista = puntos_optimista / creditos_finales
        
        # Escenario 4: Perfecto (100 en todo)
        puntos_perfecto = estado_actual['puntos_totales'] + (100 * total_creditos_nuevos)
        promedio_perfecto = puntos_perfecto / creditos_finales
        
        return {
            'promedio_actual': estado_actual['promedio'],
            'escenarios': [
                {
                    'nombre': 'Pesimista (Aprobar con 61)',
                    'nota_promedio': 61,
                    'promedio_final': round(promedio_pesimista, 2)
                },
                {
                    'nombre': 'Realista (Promedio 75)',
                    'nota_promedio': 75,
                    'promedio_final': round(promedio_realista, 2)
                },
                {
                    'nombre': 'Optimista (Promedio 90)',
                    'nota_promedio': 90,
                    'promedio_final': round(promedio_optimista, 2)
                },
                {
                    'nombre': 'Perfecto (100 en todo)',
                    'nota_promedio': 100,
                    'promedio_final': round(promedio_perfecto, 2)
                }
            ]
        }


# -----------------------------------------------------------
# FUNCIONES AUXILIARES PARA MAIN.PY
# -----------------------------------------------------------
def crear_optimizador(path_pensum='Data/pensum_sistemas.csv'):
    return OptimizadorPromedio(path_pensum)


def calcular_notas_objetivo(optimizador, cursos_aprobados, cursos_actuales, promedio_objetivo):
    return optimizador.calcular_notas_necesarias(
        cursos_aprobados, 
        cursos_actuales, 
        promedio_objetivo
    )


# -----------------------------------------------------------
# PRUEBA DEL MÓDULO
# -----------------------------------------------------------
if __name__ == "__main__":
    print("Probando el Optimizador de Promedio...\n")
    
    # Crear optimizador
    optimizador = crear_optimizador()
    
    # Datos de prueba
    cursos_aprobados = [
        {'codigo': '5', 'nota': 70},
        {'codigo': '17', 'nota': 75},
        {'codigo': '101', 'nota': 65},
        {'codigo': '6', 'nota': 80},
        {'codigo': '103', 'nota': 70},
        {'codigo': '147', 'nota': 68},
    ]
    
    cursos_actuales = ['107', '150', '770', '795']  # Cursos de 3er semestre
    
    # Caso 1: Promedio objetivo realista (75)
    print("Caso 1: Promedio Objetivo = 75")
    resultado = calcular_notas_objetivo(optimizador, cursos_aprobados, cursos_actuales, 75)
    print(f"   Factible: {resultado['factible']}")
    print(f"   Promedio Actual: {resultado['promedio_actual']}")
    print(f"   {resultado['mensaje']}")
    if resultado['factible']:
        print(f"   Notas necesarias:")
        for nota in resultado['notas_necesarias']:
            print(f"      - {nota['codigo']}: {nota['nota_minima']:.2f} (sugerida: {nota['nota_sugerida']:.2f})")
    print()
    
    # Caso 2: Promedio objetivo alto (85)
    print("Caso 2: Promedio Objetivo = 85")
    resultado = calcular_notas_objetivo(optimizador, cursos_aprobados, cursos_actuales, 85)
    print(f"   Factible: {resultado['factible']}")
    print(f"   {resultado['mensaje']}")
    if resultado['factible']:
        print(f"   Notas necesarias:")
        for nota in resultado['notas_necesarias']:
            print(f"      - {nota['codigo']}: {nota['nota_minima']:.2f} (sugerida: {nota['nota_sugerida']:.2f})")
    print()
    
    # Caso 3: Promedio imposible (95)
    print("Caso 3: Promedio Objetivo = 95 (Imposible)")
    resultado = calcular_notas_objetivo(optimizador, cursos_aprobados, cursos_actuales, 95)
    print(f"   Factible: {resultado['factible']}")
    print(f"   {resultado['mensaje']}")
    print()
    
    # Caso 4: Simular escenarios
    print("Caso 4: Simulacion de Escenarios")
    escenarios = optimizador.simular_escenarios(cursos_aprobados, cursos_actuales)
    print(f"   Promedio Actual: {escenarios['promedio_actual']:.2f}")
    print(f"   Escenarios posibles:")
    for esc in escenarios['escenarios']:
        print(f"      - {esc['nombre']}: {esc['promedio_final']:.2f}")
    
    print("\nPruebas completadas!")
