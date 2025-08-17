import pandas as pd
from django.core.management.base import BaseCommand
from competencias.models import GAC, RAC, Materia

class Command(BaseCommand):
    help = "Importa datos de competencias desde Excel"

    def add_arguments(self, parser):
        parser.add_argument("excel_path", type=str, help="Ruta al archivo Excel")

    def handle(self, *args, **kwargs):
        excel_path = kwargs["excel_path"]

        # Leer Excel
        df = pd.read_excel(excel_path)
        print("Columnas disponibles en el DataFrame:", df.columns.tolist())
        # Normalizar nombres de columnas
        df.columns = df.columns.str.strip()

        for _, row in df.iterrows():
            # ---------------- GAC ----------------
            gac_numero = row["#GAC"]

            # Si viene como string tipo "GAC3", quitamos letras
            if isinstance(gac_numero, str):
                gac_numero = ''.join(filter(str.isdigit, gac_numero)) or None

            gac, created_gac = GAC.objects.get_or_create(
                numero=int(gac_numero) if gac_numero else None,
                defaults={"descripcion": row["GAC"]}
            )

            # Si ya existía, actualizar descripción si aplica
            if not created_gac and pd.notna(row["GAC"]):
                gac.descripcion = row["GAC"]
                gac.save()

            # ---------------- RAC ----------------
            rac_numero = row["#RAC"]

            # Si viene como string tipo "RAC 1", extraemos solo el número
            if isinstance(rac_numero, str):
                rac_numero = ''.join(filter(str.isdigit, rac_numero)) or None

            rac, created_rac = RAC.objects.get_or_create(
                numero=int(rac_numero) if rac_numero else None,
                defaults={"descripcion": row["RAC"]}
            )

            # Si ya existía, actualizar descripción si aplica
            if not created_rac and pd.notna(row["RAC"]):
                rac.descripcion = row["RAC"]
                rac.save()

            # ---------------- Relación ----------------
            rac.gacs.add(gac)
            # ---------------- MATERIAS ----------------
            materia_cols = [
                "MATERIA RELACIONADA CON EL RAC",
                "MATERIA RELACIONADA CON EL RAC.1",
                "MATERIA RELACIONADA CON EL RAC.2",
                "MATERIA RELACIONADA CON EL RAC.3",
            ]

            for col in materia_cols:
                if col in row and pd.notna(row[col]):
                    materia_nombre = str(row[col]).strip()

                    materia, created_materia = Materia.objects.get_or_create(
                        nombre=materia_nombre,
                        defaults={"descripcion": f"Materia relacionada con RAC {rac.numero}"}
                    )

                    # Relación Materia ↔ RAC
                    materia.racs.add(rac)
        self.stdout.write(self.style.SUCCESS("✅ Importación completada"))
