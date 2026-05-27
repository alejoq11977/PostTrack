from django.db import migrations

# Indicaciones observacionales (no diagnósticas) por factor. Guían al propietario
# sobre CÓMO observar cada signo; son editables después en el admin.
INSTRUCTIONS = {
    'Hinchazón': 'Compara el tamaño y la forma de la zona con cómo se veía el día de la cirugía. Observa si está más abultada o tensa.',
    'Decaimiento': 'Compárala con su comportamiento habitual: ¿se levanta, se mueve y responde como siempre, o está más apagada?',
    'Alteración en defecación': 'Fíjate cuándo fue la última vez que hizo popó y cómo se veía (color, consistencia, presencia de sangre).',
    'Alteración en micción': 'Observa si orina con normalidad, si lo intenta sin lograrlo o si se queja al hacerlo.',
    'Náuseas': 'Fíjate en babeo abundante, relamidos constantes o movimientos de arcada sin llegar a vomitar.',
    'Vómito': 'Cuenta cuántas veces vomitó y observa el contenido (alimento, líquido, espuma o sangre).',
    'Inapetencia': 'Ofrécele su comida habitual y observa si la come, la prueba sin interés o la rechaza por completo.',
    'Falta de ingesta hídrica': 'Revisa el nivel del agua de su recipiente y si se acerca a beber durante el día.',
    'Aislamiento': 'Llámala o acércate como de costumbre: observa si responde y busca contacto, o si se aparta y se esconde.',
    'Supuración serosa': 'Observa la herida con buena luz; fíjate si sale líquido claro o rosado, sin color amarillo ni mal olor.',
    'Supuración purulenta': 'Revisa la herida de cerca y con buena luz; presta atención al color (amarillo o verde), al espesor y al olor.',
    'Fiebre': 'Con el dorso de la mano, compara la temperatura de orejas, almohadillas y vientre con la de otras zonas del cuerpo.',
    'Lamido excesivo': 'Observa si dirige la lengua o los dientes a la herida de forma repetida, incluso cuando la distraes.',
    'Dolor al tacto': 'Acerca la mano despacio cerca de la herida (sin presionar) y observa su reacción: quejido, retirada o gruñido.',
    'Calor local': 'Con el dorso de la mano, compara la temperatura de la piel junto a la herida con la de una zona alejada del cuerpo.',
    'Apertura de herida': 'Revisa que los puntos de sutura sigan en su lugar y que los bordes de la herida permanezcan cerrados.',
    'Postración': 'Llámala e invítala a moverse; observa si logra levantarse o permanece tumbada sin reaccionar.',
    'Inconsciencia / falta de respuesta': 'Comprueba si reacciona a tu voz, a una palmada cercana o al tacto. La ausencia total de respuesta es una urgencia.',
    'Sangrado activo': 'Observa si en este momento brota o gotea sangre roja de la herida (distinto a una mancha seca anterior).',
    'Dificultad respiratoria': 'Con la mascota en reposo, observa el ritmo y el esfuerzo al respirar: jadeo marcado, costados muy agitados o ruido.',
    'Distensión abdominal': 'Mira y palpa suavemente la barriga: fíjate si está más hinchada, tensa o dura que de costumbre.',
}


def seed_instructions(apps, schema_editor):
    GeneralQuestion = apps.get_model('monitoring', 'GeneralQuestion')
    for factor, instruction in INSTRUCTIONS.items():
        GeneralQuestion.objects.filter(
            factor=factor, is_active=True
        ).update(instruction_text=instruction)


def clear_instructions(apps, schema_editor):
    GeneralQuestion = apps.get_model('monitoring', 'GeneralQuestion')
    GeneralQuestion.objects.filter(
        factor__in=list(INSTRUCTIONS.keys()), is_active=True
    ).update(instruction_text='')


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0007_generalquestion_factor_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_instructions, clear_instructions),
    ]
