# Formato do JSON do Girassol

O app lê e gera arquivos `.json`. Existem dois usos:

1. **Backup completo** (Ajustes → Exportar): tem tudo (`profile`, `plans`, `exercises`, `sessions`, `bodyLogs`, `meals`, `foodDays` e, se marcado, `media`) e um `resumo` legível (incluindo `resumo.alimentacao`).
2. **Ficha nova** (feita à mão ou por uma IA): só precisa de `plans` (e, se quiser, `schedule`).

Na importação, o app mostra o que tem no arquivo e pergunta:
- **Restaurar backup completo**: substitui tudo que está no app (só aparece se o arquivo tiver treinos ou perfil).
- **Trocar minhas fichas por essas**: apaga as fichas atuais e coloca as do arquivo, aplicando a `schedule` se houver. O **histórico de treinos fica intacto**.
- **Adicionar junto com as minhas**: mantém as atuais e acrescenta as novas.

## Ficha nova: exemplo

```json
{
  "app": "girassol",
  "formato": 1,
  "tipo": "fichas",
  "plans": [
    {
      "id": "treino-a2",
      "name": "Treino A",
      "subtitle": "Pernas & glúteos",
      "color": "sol",
      "note": "Aquecer 5 min na bicicleta.",
      "items": [
        { "exerciseId": "goblet-squat", "sets": 3, "repsMin": 8, "repsMax": 10, "restSec": 90, "loadKg": 10 },
        { "exerciseId": "barbell-hip-thrust", "sets": 4, "repsMin": 10, "repsMax": 12, "restSec": 90 },
        { "exerciseId": "split-squat-with-dumbbells", "sets": 3, "repsMin": 8, "repsMax": 10, "restSec": 75, "perSide": true },
        { "exerciseId": "plank", "sets": 3, "repsMin": 30, "repsMax": 40, "restSec": 45 },
        { "exerciseName": "Glúteo na máquina (coice)", "sets": 3, "repsMin": 12, "repsMax": 15, "restSec": 60, "perSide": true }
      ]
    }
  ],
  "schedule": {
    "2": { "planId": "treino-a2" }
  }
}
```

### Campos de cada ficha (`plans[]`)

| Campo | Obrigatório | O que é |
| --- | --- | --- |
| `id` | não | identificador (se faltar, o app cria). Use para ligar a ficha à `schedule` |
| `name` | sim | "Treino A" |
| `subtitle` | não | foco: "Pernas & glúteos" |
| `color` | não | `sol`, `folha`, `pessego`, `ceu` ou `lilas` |
| `note` | não | observação da ficha (aquecimento etc.) |
| `items` | sim | lista de exercícios, na ordem |

### Campos de cada exercício da ficha (`items[]`)

| Campo | Padrão | O que é |
| --- | --- | --- |
| `exerciseId` | — | id de um exercício do catálogo (tabela abaixo) |
| `exerciseName` | — | use **no lugar** de `exerciseId` para um exercício que não está no catálogo: o app cria um exercício novo com esse nome (ela pode adicionar foto/vídeo depois) |
| `sets` | 3 | número de séries |
| `repsMin` / `repsMax` | 10 / igual ao min | faixa de repetições. Em prancha/alongamentos é **segundos**; em cardio, **minutos** |
| `restSec` | 60 | descanso entre séries, em segundos |
| `loadKg` | — | carga sugerida para a primeira vez (opcional; depois o app usa a última carga dela) |
| `perSide` | false | `true` = "cada lado" (afundo, prancha lateral…) |
| `note` | — | observação do exercício |

### Agenda (`schedule`)

Chave = dia da semana (`"0"` domingo, `"1"` segunda … `"6"` sábado), valor = `{ "planId": "...", "optional": true|false }`. Dias ausentes são descanso. A agenda só é aplicada na opção **"Trocar minhas fichas por essas"**.

## Catálogo de exercícios (`exerciseId`)

| exerciseId | Nome no app |
| --- | --- |
| `goblet-squat` | Agachamento goblet |
| `bodyweight-squat` | Agachamento livre (sem peso) |
| `leg-press` | Leg press |
| `hack-squat` | Agachamento hack (máquina) |
| `barbell-hip-thrust` | Elevação pélvica (hip thrust) |
| `butt-lift-bridge` | Ponte de glúteo (no chão) |
| `single-leg-glute-bridge` | Ponte de glúteo unilateral |
| `leg-extensions` | Cadeira extensora |
| `lying-leg-curls` | Mesa flexora |
| `seated-leg-curl` | Cadeira flexora |
| `thigh-abductor` | Cadeira abdutora |
| `thigh-adductor` | Cadeira adutora |
| `standing-calf-raises` | Panturrilha em pé |
| `seated-calf-raise` | Panturrilha sentada |
| `stiff-legged-dumbbell-deadlift` | Stiff com halteres |
| `romanian-deadlift` | Levantamento terra romeno (barra) |
| `dumbbell-lunges` | Passada com halteres |
| `split-squat-with-dumbbells` | Afundo com halteres |
| `glute-kickback` | Coice de glúteo (4 apoios) |
| `one-legged-cable-kickback` | Coice na polia |
| `plie-dumbbell-squat` | Agachamento sumô com halter |
| `dumbbell-step-ups` | Subida no banco (step-up) |
| `hyperextensions-back-extensions` | Hiperextensão no banco romano |
| `wide-grip-lat-pulldown` | Puxada frontal |
| `close-grip-front-lat-pulldown` | Puxada frontal fechada |
| `seated-cable-rows` | Remada baixa |
| `one-arm-dumbbell-row` | Remada unilateral (serrote) |
| `leverage-iso-row` | Remada na máquina |
| `leverage-chest-press` | Supino na máquina |
| `dumbbell-bench-press` | Supino com halteres |
| `incline-push-up` | Flexão inclinada (mãos no banco) |
| `butterfly` | Voador (peck deck) |
| `dumbbell-shoulder-press` | Desenvolvimento com halteres |
| `leverage-shoulder-press` | Desenvolvimento na máquina |
| `side-lateral-raise` | Elevação lateral |
| `reverse-machine-flyes` | Crucifixo invertido (máquina) |
| `dumbbell-alternate-bicep-curl` | Rosca alternada |
| `hammer-curls` | Rosca martelo |
| `triceps-pushdown-rope-attachment` | Tríceps na polia (corda) |
| `tricep-dumbbell-kickback` | Tríceps coice com halter |
| `plank` | Prancha |
| `side-bridge` | Prancha lateral |
| `dead-bug` | Dead bug (inseto morto) |
| `crunches` | Abdominal curto (crunch) |
| `reverse-crunch` | Abdominal invertido |
| `superman` | Super-homem |
| `mountain-climbers` | Escalador |
| `walking-treadmill` | Esteira (caminhada) |
| `bicycling-stationary` | Bicicleta ergométrica |
| `elliptical-trainer` | Elíptico (transport) |
| `cat-stretch` | Gato-camelo 🐱 |
| `childs-pose` | Postura da criança |
| `kneeling-hip-flexor` | Alongamento da frente do quadril |
| `hamstring-stretch` | Alongamento posterior de coxa |

## Texto pronto para pedir a próxima ficha a uma IA

> Segue o backup do app de treino da minha namorada (arquivo JSON exportado do app "Girassol"). Olhe o campo `resumo` e o histórico em `sessions` para ver cargas, frequência e como ela se sentiu. Monte uma nova divisão de treino para ela [objetivo/dias/observações]. Responda **apenas** com um JSON no formato abaixo, usando `exerciseId` do catálogo sempre que possível (ou `exerciseName` para exercícios novos), com `loadKg` sugerido a partir das cargas que ela já usa:
>
> *(cole aqui o exemplo e as tabelas deste arquivo)*
