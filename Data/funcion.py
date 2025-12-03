import pandas as pd

def analizar_avance(pensum_csv, aprobados_csv):
    # Leer archivos
    pensum = pd.read_csv(pensum_csv)
    aprobados = pd.read_csv(aprobados_csv)

    # Convertir códigos a tipo numérico
    pensum['Codigo'] = pd.to_numeric(pensum['Codigo'], errors='coerce')
    aprobados['Codigo'] = pd.to_numeric(aprobados['Codigo'], errors='coerce')

    # Convertir Nota a numérico
    aprobados['Nota'] = pd.to_numeric(aprobados['Nota'], errors='coerce')

    # Convertir Aprobado a boolean (puede venir como string)
    aprobados['Aprobado'] = aprobados['Aprobado'].astype(str).str.lower().isin(['true', '1', 't', 'yes', 'y'])

    # ---- Datos principales ----
    total_pensum = len(pensum)
    total_aprobados = aprobados['Aprobado'].sum()

    # Promedio de notas reales
    notas_validas = aprobados.loc[aprobados['Aprobado'] == True, 'Nota']
    promedio = notas_validas.mean()

    # ---- Cursos faltantes ----
    aprobados_codigos = set(aprobados.loc[aprobados['Aprobado'] == True, 'Codigo'])
    pensum_codigos = set(pensum['Codigo'])

    codigos_faltantes = sorted(list(pensum_codigos - aprobados_codigos))

    cursos_faltantes = pensum[pensum['Codigo'].isin(codigos_faltantes)]

    return {
        "total_cursos_pensum": total_pensum,
        "total_aprobados": total_aprobados,
        "promedio": round(promedio, 2),
        "cursos_faltantes": cursos_faltantes
    }


# Ejemplo de uso
res = analizar_avance('pensum_sistemas.csv', 'cursos_aprobados.csv')

print("Total cursos del pensum:", res["total_cursos_pensum"])
print("Total aprobados:", res["total_aprobados"])
print("Promedio:", res["promedio"])
print("\nCursos que te faltan:")
print(res["cursos_faltantes"])
