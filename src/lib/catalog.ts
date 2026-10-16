import type { Category, Exercise, Measure, Muscle } from "./types";

/**
 * Exercícios que já vêm no app. As fotos (posição inicial e final) são do
 * free-exercise-db (github.com/yuhonas/free-exercise-db), domínio público,
 * e ficam salvas em /public/exercicios/<id>/0.jpg e 1.jpg.
 */
interface Def {
  id: string;
  name: string;
  muscles: Muscle[];
  secondary?: Muscle[];
  equipment: string;
  category?: Category;
  measure?: Measure;
  weighted?: boolean;
  steps: string[];
  tip?: string;
}

const DEFS: Def[] = [
  // ——— Pernas e glúteos ———
  {
    id: "goblet-squat",
    name: "Agachamento goblet",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior", "abdomen"],
    equipment: "Halter ou kettlebell",
    steps: [
      "Segure um halter em pé, colado no peito, com as duas mãos.",
      "Pés um pouco mais abertos que o quadril, pontas levemente para fora.",
      "Desça como se fosse sentar numa cadeira, joelhos indo na direção dos pés.",
      "Suba empurrando o chão com o pé inteiro.",
    ],
    tip: "Peito aberto e calcanhar no chão o tempo todo. Desça até onde conseguir sem arredondar a lombar.",
  },
  {
    id: "bodyweight-squat",
    name: "Agachamento livre (sem peso)",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior"],
    equipment: "Peso do corpo",
    weighted: false,
    steps: [
      "Pés na largura do quadril, braços esticados à frente para equilibrar.",
      "Leve o quadril para trás e para baixo, como se fosse sentar.",
      "Desça até a coxa ficar paralela ao chão (ou o quanto der com boa postura).",
      "Suba empurrando o chão.",
    ],
    tip: "Ótimo para aquecer antes do agachamento com peso.",
  },
  {
    id: "leg-press",
    name: "Leg press",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior", "panturrilha"],
    equipment: "Máquina",
    steps: [
      "Sente com as costas e o quadril bem apoiados no encosto.",
      "Pés no meio da plataforma, na largura do quadril.",
      "Destrave e desça a plataforma dobrando os joelhos até uns 90°.",
      "Empurre de volta sem travar o joelho lá em cima.",
    ],
    tip: "Não deixe o quadril descolar do banco na descida — se descolar, desça menos.",
  },
  {
    id: "hack-squat",
    name: "Agachamento hack (máquina)",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior"],
    equipment: "Máquina",
    steps: [
      "Encoste as costas no apoio e encaixe os ombros nas almofadas.",
      "Pés na plataforma, na largura do quadril.",
      "Destrave e desça controlando até a coxa ficar paralela.",
      "Suba empurrando com o pé inteiro.",
    ],
  },
  {
    id: "barbell-hip-thrust",
    name: "Elevação pélvica (hip thrust)",
    muscles: ["gluteos"],
    secondary: ["posterior"],
    equipment: "Barra ou máquina + banco",
    steps: [
      "Apoie a parte de cima das costas num banco, barra sobre o quadril (use uma espuma).",
      "Pés no chão, na largura do quadril, joelhos dobrados.",
      "Suba o quadril apertando bem o glúteo até o corpo ficar reto do ombro ao joelho.",
      "Segure 1 segundinho lá em cima e desça devagar.",
    ],
    tip: "Queixo levemente para baixo e costelas \"fechadas\": quem sobe é o quadril, não a lombar.",
  },
  {
    id: "butt-lift-bridge",
    name: "Ponte de glúteo (no chão)",
    muscles: ["gluteos"],
    secondary: ["posterior"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite de barriga para cima, joelhos dobrados, pés no chão.",
      "Empurre o chão com os calcanhares e suba o quadril.",
      "Aperte o glúteo lá em cima por 1–2 segundos.",
      "Desça devagar sem encostar totalmente.",
    ],
  },
  {
    id: "single-leg-glute-bridge",
    name: "Ponte de glúteo unilateral",
    muscles: ["gluteos"],
    secondary: ["posterior"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite de barriga para cima com um pé no chão e a outra perna esticada no ar.",
      "Suba o quadril empurrando com o calcanhar do pé apoiado.",
      "Mantenha o quadril alinhado (sem cair para um lado).",
      "Desça devagar. Faça todas de um lado e depois troque.",
    ],
  },
  {
    id: "leg-extensions",
    name: "Cadeira extensora",
    muscles: ["quadriceps"],
    equipment: "Máquina",
    steps: [
      "Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina.",
      "Rolo apoiado logo acima do tornozelo.",
      "Estique as pernas até em cima e segure 1 segundo.",
      "Desça devagar, sem deixar o peso bater.",
    ],
  },
  {
    id: "lying-leg-curls",
    name: "Mesa flexora",
    muscles: ["posterior"],
    secondary: ["panturrilha"],
    equipment: "Máquina",
    steps: [
      "Deite de barriga para baixo, rolo logo acima do calcanhar.",
      "Joelhos logo depois da ponta do banco.",
      "Dobre os joelhos trazendo o rolo em direção ao glúteo.",
      "Volte devagar, sem tirar o quadril do banco.",
    ],
  },
  {
    id: "seated-leg-curl",
    name: "Cadeira flexora",
    muscles: ["posterior"],
    equipment: "Máquina",
    steps: [
      "Sente com o joelho alinhado ao eixo da máquina e trave a coxa com a almofada.",
      "Rolo atrás do tornozelo.",
      "Puxe o rolo para baixo dobrando o joelho.",
      "Volte controlando.",
    ],
  },
  {
    id: "thigh-abductor",
    name: "Cadeira abdutora",
    muscles: ["abdutores", "gluteos"],
    equipment: "Máquina",
    steps: [
      "Sente com as costas apoiadas e as almofadas por fora dos joelhos.",
      "Abra as pernas empurrando as almofadas para fora.",
      "Segure 1 segundo aberta.",
      "Feche devagar sem deixar o peso bater.",
    ],
    tip: "Inclinar o tronco um pouco para frente puxa mais o glúteo.",
  },
  {
    id: "thigh-adductor",
    name: "Cadeira adutora",
    muscles: ["adutores"],
    equipment: "Máquina",
    steps: [
      "Sente com as almofadas por dentro dos joelhos, pernas abertas.",
      "Feche as pernas apertando a parte interna da coxa.",
      "Volte abrindo devagar até onde for confortável.",
    ],
  },
  {
    id: "standing-calf-raises",
    name: "Panturrilha em pé",
    muscles: ["panturrilha"],
    equipment: "Máquina ou degrau",
    steps: [
      "Ponta dos pés no degrau/plataforma, calcanhar para fora.",
      "Suba na ponta dos pés o máximo que conseguir.",
      "Segure 1 segundo lá em cima.",
      "Desça até sentir alongar a panturrilha.",
    ],
  },
  {
    id: "seated-calf-raise",
    name: "Panturrilha sentada",
    muscles: ["panturrilha"],
    equipment: "Máquina",
    steps: [
      "Sente com a almofada sobre as coxas, perto do joelho.",
      "Ponta dos pés na plataforma.",
      "Suba os calcanhares o máximo possível e desça devagar.",
    ],
  },
  {
    id: "stiff-legged-dumbbell-deadlift",
    name: "Stiff com halteres",
    muscles: ["posterior", "gluteos"],
    secondary: ["lombar"],
    equipment: "Halteres",
    steps: [
      "Em pé, um halter em cada mão na frente das coxas, joelhos levemente dobrados.",
      "Leve o quadril para trás deslizando os halteres rente às pernas.",
      "Desça até sentir alongar atrás da coxa (mais ou menos no meio da canela).",
      "Volte empurrando o quadril para frente e apertando o glúteo.",
    ],
    tip: "Costas retas o tempo todo! É um movimento de dobradiça do quadril, não de curvar a coluna.",
  },
  {
    id: "romanian-deadlift",
    name: "Levantamento terra romeno (barra)",
    muscles: ["posterior", "gluteos"],
    secondary: ["lombar"],
    equipment: "Barra",
    steps: [
      "Segure a barra na frente das coxas, mãos na largura dos ombros.",
      "Joelhos levemente dobrados, leve o quadril para trás.",
      "A barra desce rente às pernas até o meio da canela.",
      "Suba levando o quadril para frente.",
    ],
    tip: "Mesmo movimento do stiff — se ainda está aprendendo, prefira os halteres.",
  },
  {
    id: "dumbbell-lunges",
    name: "Passada com halteres",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior"],
    equipment: "Halteres",
    steps: [
      "Em pé, um halter em cada mão ao lado do corpo.",
      "Dê um passo grande à frente e desça até os dois joelhos dobrarem em ~90°.",
      "Empurre com o pé da frente para voltar.",
      "Alterne as pernas (ou faça todas de um lado e depois do outro).",
    ],
  },
  {
    id: "split-squat-with-dumbbells",
    name: "Afundo com halteres",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior"],
    equipment: "Halteres",
    steps: [
      "Fique com um pé à frente e outro atrás (como se fosse dar um passo grande).",
      "Halteres ao lado do corpo, tronco reto.",
      "Desça o joelho de trás em direção ao chão, sem encostar.",
      "Suba empurrando com o pé da frente. Termine um lado e troque.",
    ],
    tip: "Se perder o equilíbrio, faça sem peso segurando em algo do lado. Ninguém nasce sabendo!",
  },
  {
    id: "glute-kickback",
    name: "Coice de glúteo (4 apoios)",
    muscles: ["gluteos"],
    secondary: ["posterior"],
    equipment: "Colchonete (caneleira opcional)",
    weighted: false,
    steps: [
      "Fique de quatro: mãos embaixo dos ombros, joelhos embaixo do quadril.",
      "Leve uma perna para trás e para cima, joelho dobrado, sola do pé \"para o teto\".",
      "Aperte o glúteo lá em cima sem arquear a lombar.",
      "Volte devagar. Termine um lado e troque.",
    ],
  },
  {
    id: "one-legged-cable-kickback",
    name: "Coice na polia",
    muscles: ["gluteos"],
    secondary: ["posterior"],
    equipment: "Polia baixa + tornozeleira",
    steps: [
      "Prenda a tornozeleira na polia baixa e fique de frente para a máquina.",
      "Segure no apoio, tronco levemente inclinado.",
      "Leve a perna para trás apertando o glúteo, sem balançar o tronco.",
      "Volte controlando. Termine um lado e troque.",
    ],
    tip: "Se a polia estiver ocupada, faça o coice de 4 apoios no colchonete.",
  },
  {
    id: "plie-dumbbell-squat",
    name: "Agachamento sumô com halter",
    muscles: ["gluteos", "adutores", "quadriceps"],
    secondary: ["posterior"],
    equipment: "Halter",
    steps: [
      "Pés bem afastados, pontas viradas para fora.",
      "Segure um halter com as duas mãos entre as pernas.",
      "Desça com o tronco reto, joelhos abrindo na direção dos pés.",
      "Suba apertando glúteo e parte interna da coxa.",
    ],
  },
  {
    id: "dumbbell-step-ups",
    name: "Subida no banco (step-up)",
    muscles: ["quadriceps", "gluteos"],
    secondary: ["posterior"],
    equipment: "Banco/caixa + halteres",
    steps: [
      "Apoie um pé inteiro em cima de um banco ou caixa.",
      "Suba empurrando com a perna de cima (não tome impulso com a de baixo).",
      "Desça devagar. Termine um lado e troque.",
    ],
  },
  {
    id: "hyperextensions-back-extensions",
    name: "Hiperextensão no banco romano",
    muscles: ["lombar", "gluteos"],
    secondary: ["posterior"],
    equipment: "Banco romano",
    weighted: false,
    steps: [
      "Apoie o quadril na almofada e prenda os pés.",
      "Braços cruzados no peito, desça o tronco com as costas retas.",
      "Suba usando glúteo e posterior até o corpo ficar reto (não passe disso).",
    ],
  },

  // ——— Costas ———
  {
    id: "wide-grip-lat-pulldown",
    name: "Puxada frontal",
    muscles: ["costas"],
    secondary: ["biceps", "ombros"],
    equipment: "Polia alta",
    steps: [
      "Sente e prenda as coxas embaixo da almofada.",
      "Segure a barra com as mãos um pouco mais abertas que os ombros.",
      "Puxe a barra até a altura do queixo/peito, levando os cotovelos para baixo.",
      "Volte devagar esticando os braços.",
    ],
    tip: "Pense em \"guardar os ombros no bolso de trás\" — sem encolher os ombros.",
  },
  {
    id: "close-grip-front-lat-pulldown",
    name: "Puxada frontal fechada",
    muscles: ["costas"],
    secondary: ["biceps"],
    equipment: "Polia alta",
    steps: [
      "Sente e prenda as coxas embaixo da almofada.",
      "Segure a barra (ou o triângulo) com as mãos próximas.",
      "Puxe até o peito, cotovelos rente ao corpo.",
      "Volte devagar.",
    ],
  },
  {
    id: "seated-cable-rows",
    name: "Remada baixa",
    muscles: ["costas"],
    secondary: ["biceps", "trapezio"],
    equipment: "Polia baixa (triângulo)",
    steps: [
      "Sente com os pés apoiados e joelhos levemente dobrados.",
      "Segure o triângulo com o tronco reto.",
      "Puxe até a barriga, juntando as escápulas.",
      "Volte esticando os braços sem curvar as costas.",
    ],
  },
  {
    id: "one-arm-dumbbell-row",
    name: "Remada unilateral (serrote)",
    muscles: ["costas"],
    secondary: ["biceps"],
    equipment: "Halter + banco",
    steps: [
      "Apoie um joelho e uma mão no banco, costas retas.",
      "Com a outra mão, segure o halter com o braço esticado.",
      "Puxe o halter até a lateral da barriga, cotovelo rente ao corpo.",
      "Desça devagar. Termine um lado e troque.",
    ],
  },
  {
    id: "leverage-iso-row",
    name: "Remada na máquina",
    muscles: ["costas"],
    secondary: ["biceps"],
    equipment: "Máquina",
    steps: [
      "Ajuste o banco para as pegadas ficarem na altura do peito.",
      "Peito apoiado na almofada.",
      "Puxe as pegadas juntando as escápulas.",
      "Volte controlando.",
    ],
  },

  // ——— Peito ———
  {
    id: "leverage-chest-press",
    name: "Supino na máquina",
    muscles: ["peito"],
    secondary: ["ombros", "triceps"],
    equipment: "Máquina",
    steps: [
      "Ajuste o banco para as pegadas ficarem na altura do meio do peito.",
      "Costas bem apoiadas, ombros para trás.",
      "Empurre para frente até quase esticar os braços.",
      "Volte devagar.",
    ],
  },
  {
    id: "dumbbell-bench-press",
    name: "Supino com halteres",
    muscles: ["peito"],
    secondary: ["ombros", "triceps"],
    equipment: "Halteres + banco",
    steps: [
      "Deite no banco com um halter em cada mão na altura do peito.",
      "Pés firmes no chão, escápulas juntas.",
      "Empurre os halteres para cima até quase esticar.",
      "Desça devagar até a lateral do peito.",
    ],
  },
  {
    id: "incline-push-up",
    name: "Flexão inclinada (mãos no banco)",
    muscles: ["peito"],
    secondary: ["triceps", "ombros", "abdomen"],
    equipment: "Banco ou barra baixa",
    weighted: false,
    steps: [
      "Mãos apoiadas num banco, um pouco mais abertas que os ombros.",
      "Corpo reto da cabeça aos pés (abdômen firme).",
      "Desça o peito em direção ao banco.",
      "Empurre de volta.",
    ],
    tip: "Quanto mais alto o apoio, mais fácil. Vá baixando com o tempo!",
  },
  {
    id: "butterfly",
    name: "Voador (peck deck)",
    muscles: ["peito"],
    equipment: "Máquina",
    steps: [
      "Sente com as costas apoiadas, pegadas na altura do peito.",
      "Cotovelos levemente dobrados.",
      "Junte as pegadas à frente apertando o peito.",
      "Abra devagar até sentir alongar.",
    ],
  },

  // ——— Ombros ———
  {
    id: "dumbbell-shoulder-press",
    name: "Desenvolvimento com halteres",
    muscles: ["ombros"],
    secondary: ["triceps"],
    equipment: "Halteres + banco",
    steps: [
      "Sente com as costas apoiadas, halteres na altura das orelhas.",
      "Empurre os halteres para cima até quase esticar os braços.",
      "Desça devagar até a altura das orelhas.",
    ],
    tip: "Não arqueie a lombar — se precisar arquear, o peso está alto.",
  },
  {
    id: "leverage-shoulder-press",
    name: "Desenvolvimento na máquina",
    muscles: ["ombros"],
    secondary: ["triceps"],
    equipment: "Máquina",
    steps: [
      "Ajuste o banco para as pegadas ficarem na altura dos ombros.",
      "Empurre para cima até quase esticar.",
      "Desça controlando.",
    ],
  },
  {
    id: "side-lateral-raise",
    name: "Elevação lateral",
    muscles: ["ombros"],
    equipment: "Halteres",
    steps: [
      "Em pé, um halter leve em cada mão ao lado do corpo.",
      "Cotovelos levemente dobrados.",
      "Levante os braços para os lados até a altura dos ombros.",
      "Desça devagar.",
    ],
    tip: "Peso leve mesmo! Esse exercício engana — 1 a 3 kg já é bastante no começo.",
  },
  {
    id: "reverse-machine-flyes",
    name: "Crucifixo invertido (máquina)",
    muscles: ["ombros", "costas"],
    secondary: ["trapezio"],
    equipment: "Máquina (voador invertido)",
    steps: [
      "Sente de frente para o encosto, peito apoiado.",
      "Segure as pegadas com os braços esticados à frente.",
      "Abra os braços para trás até a linha do corpo.",
      "Volte devagar.",
    ],
  },

  // ——— Braços ———
  {
    id: "dumbbell-alternate-bicep-curl",
    name: "Rosca alternada",
    muscles: ["biceps"],
    secondary: ["antebraco"],
    equipment: "Halteres",
    steps: [
      "Em pé, um halter em cada mão, palmas viradas para frente.",
      "Cotovelos colados ao lado do corpo.",
      "Suba um halter dobrando o cotovelo, desça e troque de braço.",
    ],
    tip: "Sem balançar o tronco: se precisar de impulso, o peso está alto.",
  },
  {
    id: "hammer-curls",
    name: "Rosca martelo",
    muscles: ["biceps", "antebraco"],
    equipment: "Halteres",
    steps: [
      "Em pé, halteres ao lado do corpo com as palmas viradas uma para a outra.",
      "Suba dobrando os cotovelos, mantendo a pegada \"de martelo\".",
      "Desça devagar.",
    ],
  },
  {
    id: "triceps-pushdown-rope-attachment",
    name: "Tríceps na polia (corda)",
    muscles: ["triceps"],
    equipment: "Polia alta + corda",
    steps: [
      "De frente para a polia, segure a corda com os cotovelos colados no corpo.",
      "Empurre a corda para baixo até esticar os braços, abrindo as pontas no final.",
      "Volte até a altura do peito sem desgrudar os cotovelos.",
    ],
  },
  {
    id: "tricep-dumbbell-kickback",
    name: "Tríceps coice com halter",
    muscles: ["triceps"],
    equipment: "Halter + banco",
    steps: [
      "Apoie um joelho e uma mão no banco, como no serrote.",
      "Cotovelo do outro braço colado ao corpo, dobrado a 90°.",
      "Estique o braço para trás e volte devagar.",
    ],
  },

  // ——— Abdômen / core ———
  {
    id: "plank",
    name: "Prancha",
    muscles: ["abdomen"],
    secondary: ["obliquos", "ombros"],
    equipment: "Colchonete",
    measure: "seconds",
    weighted: false,
    steps: [
      "Apoie os antebraços no chão, cotovelos embaixo dos ombros.",
      "Estique as pernas e apoie na ponta dos pés.",
      "Corpo reto da cabeça aos calcanhares: aperte abdômen e glúteo.",
      "Respire normalmente e segure o tempo.",
    ],
    tip: "Se doer a lombar, apoie os joelhos no chão.",
  },
  {
    id: "side-bridge",
    name: "Prancha lateral",
    muscles: ["obliquos", "abdomen"],
    equipment: "Colchonete",
    measure: "seconds",
    weighted: false,
    steps: [
      "Deite de lado e apoie o antebraço no chão, cotovelo embaixo do ombro.",
      "Suba o quadril até o corpo ficar reto.",
      "Segure o tempo e troque de lado.",
    ],
    tip: "Versão mais fácil: joelhos dobrados e apoiados no chão.",
  },
  {
    id: "dead-bug",
    name: "Dead bug (inseto morto)",
    muscles: ["abdomen"],
    secondary: ["obliquos"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite de barriga para cima, braços apontando para o teto, joelhos dobrados a 90° no ar.",
      "Cole a lombar no chão.",
      "Estique um braço para trás e a perna oposta para frente, devagar.",
      "Volte e troque de lado. Cada lado conta 1.",
    ],
    tip: "A lombar não pode sair do chão. Se sair, estique menos.",
  },
  {
    id: "crunches",
    name: "Abdominal curto (crunch)",
    muscles: ["abdomen"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite com os joelhos dobrados e mãos atrás da cabeça (sem puxar o pescoço).",
      "Suba só os ombros do chão, enrolando o tronco.",
      "Desça devagar.",
    ],
  },
  {
    id: "reverse-crunch",
    name: "Abdominal invertido",
    muscles: ["abdomen"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite com as mãos ao lado do corpo e joelhos dobrados no ar.",
      "Traga os joelhos em direção ao peito tirando o quadril do chão.",
      "Volte devagar sem deixar os pés baterem.",
    ],
  },
  {
    id: "superman",
    name: "Super-homem",
    muscles: ["lombar"],
    secondary: ["gluteos", "posterior"],
    equipment: "Colchonete",
    weighted: false,
    steps: [
      "Deite de barriga para baixo com braços esticados à frente.",
      "Levante braços e pernas juntos alguns centímetros do chão.",
      "Segure 2 segundos e desça.",
    ],
  },
  {
    id: "mountain-climbers",
    name: "Escalador",
    muscles: ["abdomen", "quadriceps"],
    secondary: ["ombros"],
    equipment: "Peso do corpo",
    weighted: false,
    steps: [
      "Posição de flexão com braços esticados.",
      "Traga um joelho em direção ao peito e volte.",
      "Alterne as pernas num ritmo constante.",
    ],
  },

  // ——— Cardio ———
  {
    id: "walking-treadmill",
    name: "Esteira (caminhada)",
    muscles: [],
    equipment: "Esteira",
    category: "cardio",
    measure: "minutes",
    weighted: false,
    steps: [
      "Comece devagar por 2 minutos.",
      "Aumente a velocidade ou a inclinação até ficar \"puxado, mas dá pra conversar\".",
      "Termine com 1–2 minutos mais leves.",
    ],
  },
  {
    id: "bicycling-stationary",
    name: "Bicicleta ergométrica",
    muscles: [],
    equipment: "Bicicleta",
    category: "cardio",
    measure: "minutes",
    weighted: false,
    steps: [
      "Ajuste o banco: com o pedal embaixo, o joelho fica quase esticado.",
      "Pedale num ritmo confortável para aquecer.",
      "Aumente a carga até ficar \"puxado, mas dá pra conversar\".",
    ],
  },
  {
    id: "elliptical-trainer",
    name: "Elíptico (transport)",
    muscles: [],
    equipment: "Elíptico",
    category: "cardio",
    measure: "minutes",
    weighted: false,
    steps: [
      "Suba e segure nas alças.",
      "Movimente pernas e braços num ritmo constante.",
      "Ajuste a carga para ficar moderado.",
    ],
  },

  // ——— Mobilidade / alongamento ———
  {
    id: "cat-stretch",
    name: "Gato-camelo 🐱",
    muscles: [],
    equipment: "Colchonete",
    category: "mobilidade",
    weighted: false,
    steps: [
      "Fique de quatro apoios.",
      "Arredonde as costas para cima como um gatinho bravo, olhando para o umbigo.",
      "Depois afunde as costas e olhe para frente.",
      "Alterne devagar respirando fundo.",
    ],
  },
  {
    id: "childs-pose",
    name: "Postura da criança",
    muscles: [],
    equipment: "Colchonete",
    category: "mobilidade",
    measure: "seconds",
    weighted: false,
    steps: [
      "Ajoelhe e sente sobre os calcanhares.",
      "Leve o tronco à frente e estique os braços no chão.",
      "Relaxe e respire fundo.",
    ],
  },
  {
    id: "kneeling-hip-flexor",
    name: "Alongamento da frente do quadril",
    muscles: [],
    equipment: "Colchonete",
    category: "mobilidade",
    measure: "seconds",
    weighted: false,
    steps: [
      "Ajoelhe com um joelho no chão e o outro pé à frente.",
      "Aperte o glúteo da perna de trás e leve o quadril um pouco para frente.",
      "Sinta alongar a frente do quadril. Segure e troque de lado.",
    ],
  },
  {
    id: "hamstring-stretch",
    name: "Alongamento posterior de coxa",
    muscles: [],
    equipment: "Colchonete",
    category: "mobilidade",
    measure: "seconds",
    weighted: false,
    steps: [
      "Deite de barriga para cima e levante uma perna esticada.",
      "Segure atrás da coxa (ou use uma toalha no pé).",
      "Puxe com calma até sentir alongar. Segure e troque.",
    ],
  },
];

export const BUILTIN_EXERCISES: Exercise[] = DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  muscles: d.muscles,
  secondary: d.secondary ?? [],
  equipment: d.equipment,
  category: d.category ?? "forca",
  measure: d.measure ?? "reps",
  weighted: d.weighted ?? true,
  frames: [`/exercicios/${d.id}/0.jpg`, `/exercicios/${d.id}/1.jpg`],
  steps: d.steps,
  tip: d.tip,
  media: [],
  custom: false,
  updatedAt: 0,
}));

export const CATEGORY_LABEL: Record<Category, string> = {
  forca: "Musculação",
  cardio: "Cardio",
  mobilidade: "Alongamento",
};

export function youtubeSearchUrl(name: string) {
  const clean = name.replace(/\(.*?\)/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${clean} execução correta`)}`;
}
