# 🌻 Girassol: diário de treino

Site de academia feito para usar no iPhone, sem precisar baixar app nenhum. Ele mostra a ficha do dia com foto de cada exercício, registra as séries e o descanso e acompanha a evolução. Tudo fica salvo **no próprio celular**.

- **Sem servidor e sem login**: os dados ficam no IndexedDB do navegador. Para fazer backup ou trocar de celular, existe exportar/importar em **JSON**.
- **Funciona como app**: no Safari, *Compartilhar → Adicionar à Tela de Início*. Também abre sem internet, o que ajuda quando o sinal da academia é ruim.
- **Cara de aquarela**, com girassóis e um gatinho que ela escolhe (cor e nome).

## O que tem

| Tela | O que faz |
| --- | --- |
| **Hoje** | Treino do dia pela agenda da semana, semana com girassóis nos dias treinados e atalho para as outras fichas |
| **Fichas** | Fichas A/B/C/D, editor (séries, repetições, descanso, carga, dias da semana) e dicas para iniciante |
| **Exercício** | Fotos da posição inicial/final (animadas), passo a passo em português, músculos no desenho do corpo, botão "ver no YouTube", **fotos/GIFs/vídeos/links dela** e anotação ("banco na posição 4") |
| **Treino** | Registra kg × reps por série, preenche com o que fez da última vez, cronometra o descanso (com bipe), troca o exercício se a máquina estiver ocupada e avisa quando dá para subir a carga |
| **Resumo** | Comemoração, duração, séries, kg levantados, recordes e "como você se sentiu" |
| **Evolução** | Mapa muscular (descansando/recuperando/pronto), calendário, gráfico por exercício e histórico |
| **Comida** | Diário de refeições (texto, grupos alimentares e foto opcional), água em copos, "girassol do dia" com metas simples e ideias do que comer em cada momento (inclusive antes e depois do treino) |
| **Corpo** | Peso, medidas e fotos de progresso (tudo opcional e com linguagem gentil) |
| **Ajustes** *(engrenagem na tela Hoje)* | Perfil, gatinho, agenda da semana, tema claro/escuro, **exportar/importar JSON** |

## A ficha inicial

Montada para iniciante (17 anos, ~65 kg, ~1,73 m), treinando **terça, quinta e sexta**, com **quarta opcional e leve**:

| Dia | Ficha | Foco |
| --- | --- | --- |
| Terça | **Treino A** | Pernas & glúteos: agachamento goblet, leg press, elevação pélvica, extensora, abdutora, prancha |
| Quarta *(opcional)* | **Treino D** | Leve: bicicleta 15–20 min, ponte de glúteo, gato-camelo 🐱, prancha lateral, abdominal invertido, alongamentos |
| Quinta | **Treino B** | Costas, peito & braços: puxada, remada baixa, supino máquina, desenvolvimento, elevação lateral, rosca, tríceps corda |
| Sexta | **Treino C** | Glúteos & posterior: stiff com halteres, afundo, mesa flexora, coice na polia, panturrilha, dead bug |

Por que assim:
- Terça e sexta (pernas) ficam com 3 dias entre si. Quinta é parte de cima, então quinta → sexta não repete músculo.
- 2–3 séries de 8–15 repetições, com carga que deixe 2–3 repetições "sobrando". Postura vem antes de peso.
- **Progressão dupla**: fez todas as séries no máximo de repetições? Na próxima, sobe um pouquinho a carga. O app avisa com um girassol 🌻.
- Nas primeiras semanas, vale pedir para o professor da academia conferir a execução.

## Alimentação

A área de comida foi pensada para hábito, não para dieta: **não conta calorias** e não tem "comida proibida" (com 17 anos o corpo ainda está crescendo, e contar caloria nessa idade costuma fazer mais mal do que bem). Ela anota o que comeu e marca os grupos (proteína, carboidrato, fruta, verdura/legume, leite/iogurte/queijo, docinho). O app transforma isso em pétalas de um girassol:

- água no objetivo (padrão 8 copos de 250 ml, dá pra mudar)
- tomou café da manhã
- proteína em 3 refeições
- 2 frutas
- verduras/legumes em 2 refeições
- 1 porção de leite/iogurte/queijo
- nos dias de treino: comeu antes e depois do treino

As ideias do que comer são comidas brasileiras simples, separadas por momento (café, lanche, almoço/jantar, pré-treino, pós-treino, ceia). Tocar em uma já registra a refeição. Para um plano alimentar individual, o ideal é uma nutricionista.

## Rodar no computador

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # gera o site estático em ./out
```

Requer Node 20+.

## Publicar no Vercel

1. Suba este repositório no GitHub.
2. No Vercel: **Add New → Project**, importe o repositório.
3. Em **Root Directory**, escolha **`my-app`**. O resto é detectado sozinho (framework Next.js).
4. Deploy. Abra o link no Safari do iPhone dela, toque em **Compartilhar → Adicionar à Tela de Início** e use pelo ícone.

> ⚠️ No iPhone, o app da Tela de Início e o Safari guardam dados **separados**. Por isso o app pede para instalar logo no começo. Se ela já tiver registrado treinos no Safari, basta exportar lá e importar no app.

## Backup e troca de ficha (JSON)

**Ajustes → Seus dados → Exportar** gera um arquivo `girassol-treinos-AAAA-MM-DD.json` com:
- `resumo`: visão rápida para quem vai montar a próxima ficha (cargas por exercício, quantas vezes fez, como se sentiu…)
- `plans`, `sessions`, `exercises`, `bodyLogs`, `meals`, `foodDays`, `profile`: os dados completos

Para **trocar a ficha**: escreva um JSON no formato de [`FORMATO_JSON.md`](./FORMATO_JSON.md) (tem exemplo pronto e um texto para pedir a uma IA). Depois vá em **Ajustes → Importar → "Trocar minhas fichas por essas"**. O histórico de treinos não é apagado.

## Tecnologia

- Next.js 16 (App Router, `output: "export"`), React 19, TypeScript, Tailwind CSS 4
- [Dexie](https://dexie.org) (IndexedDB) para o "banco" local
- [react-muscle-highlighter](https://github.com/soroojshehryar/react-muscle-highlighter) (MIT) para o desenho do corpo
- Fotos dos exercícios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público), salvas em `public/exercicios/`
- Ilustrações (girassóis, gatinhos, aquarela) desenhadas em SVG no próprio código (`src/components/art.tsx`)

```
src/
  app/            páginas (/, /fichas, /fichas/editar, /exercicio, /treino, /treino/resumo, /comida, /evolucao, /corpo, /ajustes)
  components/     UI, ilustrações, mídia, mapa do corpo, seletor de exercícios
  lib/
    catalog.ts    os 54 exercícios (nomes e passo a passo em português)
    seed.ts       a ficha inicial e a agenda da semana
    db.ts         banco local (Dexie)
    backup.ts     exportar / importar JSON
    stats.ts      última vez, recordes, recuperação muscular
    food.ts       grupos alimentares, refeições, sugestões e metas do dia
public/
  exercicios/     fotos dos exercícios
  sw.js           service worker (abrir offline)
```
