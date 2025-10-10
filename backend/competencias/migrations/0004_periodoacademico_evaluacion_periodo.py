# Generated manually for PeriodoAcademico model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('competencias', '0003_alter_evaluacion_puntaje'),
    ]

    operations = [
        # Crear modelo PeriodoAcademico
        migrations.CreateModel(
            name='PeriodoAcademico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(max_length=10, unique=True, verbose_name='Código del período')),
                ('nombre', models.CharField(max_length=50, verbose_name='Nombre del período')),
                ('año', models.IntegerField(verbose_name='Año')),
                ('semestre', models.IntegerField(choices=[(1, 'Primer Semestre'), (2, 'Segundo Semestre')], verbose_name='Semestre')),
                ('fecha_inicio', models.DateField(verbose_name='Fecha de inicio')),
                ('fecha_fin', models.DateField(verbose_name='Fecha de fin')),
                ('activo', models.BooleanField(default=True, verbose_name='Período activo')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
            ],
            options={
                'verbose_name': 'Período Académico',
                'verbose_name_plural': 'Períodos Académicos',
                'ordering': ['-año', '-semestre'],
            },
        ),
        
        # Agregar constraint único para año y semestre
        migrations.AddConstraint(
            model_name='periodoacademico',
            constraint=models.UniqueConstraint(fields=('año', 'semestre'), name='unique_año_semestre'),
        ),
        
        # Agregar campo periodo a Evaluacion
        migrations.AddField(
            model_name='evaluacion',
            name='periodo',
            field=models.ForeignKey(
                blank=True, 
                null=True, 
                on_delete=django.db.models.deletion.CASCADE, 
                related_name='evaluaciones', 
                to='competencias.periodoacademico', 
                verbose_name='Período académico'
            ),
        ),
        
        # Actualizar unique_together para incluir periodo
        migrations.AlterUniqueTogether(
            name='evaluacion',
            unique_together={('estudiante', 'rac', 'profesor', 'periodo')},
        ),
    ]
