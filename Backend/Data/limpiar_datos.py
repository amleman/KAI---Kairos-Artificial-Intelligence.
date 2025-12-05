import pandas as pd
import re

# 1. Cargar el Excel original (asegúrate que se llame así)
df = pd.read_excel('cursos.xlsx') # O pd.read_csv si ya lo pasaste a csv

# 2. Función para convertir hora "HH:MM" a minutos (INT)
def time_to_min(t):
    try:
        h, m = map(int, str(t).split(':'))
        return h * 60 + m
    except:
        return 0

# 3. Limpiar Nombres y Códigos
def separar_codigo(texto):
    match = re.match(r'(\d+)\s+(.*)', str(texto))
    if match:
        return match.group(1), match.group(2)
    return str(texto), str(texto) # Fallback

df['Inicio_Min'] = df['Inicio'].apply(time_to_min)
df['Final_Min'] = df['Final'].apply(time_to_min)
df['Codigo'], df['Nombre_Limpio'] = zip(*df['Nombre de Curso'].map(separar_codigo))

# 4. Limpiar los Días (Esto arregla el formato feo ['X', None...])
def parse_dias(dias_str):
    mapa = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
    try:
        # Limpieza sucia de string a lista real
        limpio = str(dias_str).replace('[','').replace(']','').replace("'", "")
        items = [x.strip() for x in limpio.split(',')]
        dias_activos = []
        for i, val in enumerate(items):
            if val == 'X' and i < len(mapa):
                dias_activos.append(mapa[i])
        return dias_activos
    except:
        return []

df['Dias_Lista'] = df['Dias'].apply(parse_dias)

# 5. Guardar el archivo LIMPIO que usará el motor
df.to_csv('cursos_oferta_limpio.csv', index=False)
print("¡Archivo limpio generado! Ahora tu motor funcionará.")