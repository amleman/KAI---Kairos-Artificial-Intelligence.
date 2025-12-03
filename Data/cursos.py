import pandas as pd

def xlsx_to_csv_unique(input_file, output_file):
    # Leer el Excel
    df = pd.read_excel(input_file)

    # Separar la columna "Nombre de Curso"
    df[['codigo', 'nombre']] = df['Nombre de Curso'].str.split(
        pat=' ', 
        n=1,
        expand=True
    )

    # Eliminar duplicados por código y nombre
    df_unique = df[['codigo', 'nombre']].drop_duplicates()

    # Guardar en CSV
    df_unique.to_csv(output_file, index=False, encoding='utf-8')

    print("Archivo CSV creado:", output_file)


# Ejemplo de uso
xlsx_to_csv_unique('cursos.xlsx', 'cursos_unicos.csv')