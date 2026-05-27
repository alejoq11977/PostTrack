from django.db import migrations

L, M, H = 'LOW', 'MEDIUM', 'HIGH'

# (factor, texto de la pregunta, [riesgo V1, V2, V3])
FACTORS = [
    ('Hinchazón', '¿La zona de la herida se ve hinchada?', [L, M, H]),
    ('Decaimiento', '¿Su mascota se ve claramente decaída o menos activa de lo normal?', [L, M, H]),
    ('Alteración en defecación', '¿Su mascota ha pasado más de 48 horas sin defecar, o sus heces son anormales (con sangre o muy líquidas)?', [L, M, H]),
    ('Alteración en micción', '¿Su mascota ha pasado más de 24 horas sin orinar, o tiene dificultad notoria al hacerlo?', [M, H, H]),
    ('Náuseas', '¿Su mascota muestra náuseas (babeo excesivo, arcadas sin vomitar)?', [L, M, M]),
    ('Vómito', '¿Su mascota ha vomitado recientemente?', [L, H, H]),
    ('Inapetencia', '¿Su mascota está rechazando la comida?', [L, M, H]),
    ('Falta de ingesta hídrica', '¿Su mascota está bebiendo poca o nada de agua?', [M, H, H]),
    ('Aislamiento', '¿Su mascota está evitando interactuar (no responde, se aísla)?', [L, M, H]),
    ('Supuración serosa', '¿Sale líquido transparente o rosado de la herida?', [L, M, H]),
    ('Supuración purulenta', '¿Sale líquido amarillo, verde, espeso o con mal olor de la herida?', [H, H, H]),
    ('Fiebre', '¿Las orejas, almohadillas o el vientre se sienten anormalmente calientes al tacto?', [M, H, H]),
    ('Lamido excesivo', '¿Su mascota intenta lamer o morder la herida de forma repetida?', [M, M, H]),
    ('Dolor al tacto', 'Al acercar la mano a la herida, ¿gime, se aparta, gruñe o intenta morder?', [M, H, H]),
    ('Calor local', '¿La zona alrededor de la herida se siente más caliente que otras zonas del cuerpo?', [M, H, H]),
    ('Apertura de herida', '¿Algún punto de sutura se ha desprendido o la herida se ha abierto?', [H, H, H]),
    ('Postración', '¿Su mascota está acostada sin levantarse, sin reaccionar al ser llamada o estimulada?', [H, H, H]),
    ('Inconsciencia / falta de respuesta', '¿Su mascota está inconsciente o no responde en absoluto a estímulos fuertes (voz, palmadas, tacto)?', [H, H, H]),
    ('Sangrado activo', '¿Sale sangre fresca de la herida en este momento?', [H, H, H]),
    ('Dificultad respiratoria', 'Estando en reposo (sin haberse movido), ¿respira muy rápido o con esfuerzo?', [H, H, H]),
    ('Distensión abdominal', '¿El abdomen se ve o se siente muy hinchado o duro?', [H, H, H]),
]

# Combinaciones críticas -> ALTO (las de "O" ya vienen divididas en reglas individuales)
COMBOS = [
    ('Fiebre + supuración serosa', ['Fiebre', 'Supuración serosa']),
    ('Fiebre + supuración purulenta', ['Fiebre', 'Supuración purulenta']),
    ('Hinchazón + dolor al tacto + calor local', ['Hinchazón', 'Dolor al tacto', 'Calor local']),
    ('Vómito + inapetencia + decaimiento', ['Vómito', 'Inapetencia', 'Decaimiento']),
    ('Decaimiento + fiebre', ['Decaimiento', 'Fiebre']),
    ('Inapetencia + alteración en defecación', ['Inapetencia', 'Alteración en defecación']),
    ('Lamido excesivo + apertura de herida', ['Lamido excesivo', 'Apertura de herida']),
    ('Hinchazón + supuración purulenta', ['Hinchazón', 'Supuración purulenta']),
    ('Falta de ingesta hídrica + alteración en micción', ['Falta de ingesta hídrica', 'Alteración en micción']),
]


def seed(apps, schema_editor):
    GeneralQuestion = apps.get_model('monitoring', 'GeneralQuestion')
    RiskWindow = apps.get_model('patients', 'RiskWindow')
    FactorWindowRisk = apps.get_model('patients', 'FactorWindowRisk')
    RiskRule = apps.get_model('patients', 'RiskRule')
    RiskThreshold = apps.get_model('patients', 'RiskThreshold')

    # 1) Deactivate the previous question set (historical reports keep their references).
    GeneralQuestion.objects.update(is_active=False)

    # 2) Windows (measured from surgery_date).
    windows = [
        RiskWindow.objects.create(label='Ventana 1 (0-48h)', start_hour=0, order=1, is_active=True),
        RiskWindow.objects.create(label='Ventana 2 (49-120h)', start_hour=49, order=2, is_active=True),
        RiskWindow.objects.create(label='Ventana 3 (121h+)', start_hour=121, order=3, is_active=True),
    ]

    # 3) The 21 factors + their per-window risk.
    factor_to_qid = {}
    for factor, text, levels in FACTORS:
        q = GeneralQuestion.objects.create(
            text=text, factor=factor, associated_risk=levels[0],
            instruction_text='', is_active=True,
        )
        factor_to_qid[factor] = q.id
        for window, lvl in zip(windows, levels):
            FactorWindowRisk.objects.create(question_id=q.id, window=window, risk_level=lvl)

    # 4) Critical combinations -> HIGH (replace any previous rules).
    RiskRule.objects.all().delete()
    for name, factors in COMBOS:
        RiskRule.objects.create(
            name=name,
            description='Combinación crítica → ALTO',
            question_ids=[factor_to_qid[f] for f in factors],
            result_level=H,
            is_active=True,
        )

    # 5) Thresholds (replace any previous): Reglas 3 y 4.
    RiskThreshold.objects.all().delete()
    RiskThreshold.objects.create(level=M, min_count=2, escalates_to=H, is_active=True)  # 2+ medio -> alto
    RiskThreshold.objects.create(level=L, min_count=2, escalates_to=M, is_active=True)  # 2-3 bajo -> medio
    RiskThreshold.objects.create(level=L, min_count=4, escalates_to=H, is_active=True)  # 4+ bajo -> alto


def unseed(apps, schema_editor):
    # Best-effort reverse: drop the seeded windows/risks/rules.
    RiskWindow = apps.get_model('patients', 'RiskWindow')
    FactorWindowRisk = apps.get_model('patients', 'FactorWindowRisk')
    FactorWindowRisk.objects.all().delete()
    RiskWindow.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0005_riskwindow_alter_riskrule_options_and_more'),
        ('monitoring', '0007_generalquestion_factor_and_more'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
