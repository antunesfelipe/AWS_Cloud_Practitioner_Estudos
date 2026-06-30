# Central de Estudos AWS CLF-C02

App de estudo completo pro AWS Certified Cloud Practitioner (CLF-C02). Vanilla HTML/CSS/JS, sem build, sem dependências, sem backend.

## O que tem

**Flashcards**
- 100 cards na proporção real do exame: D1 Cloud Concepts (24) · D2 Security & Compliance (30) · D3 Cloud Tech & Services (34) · D4 Billing/Pricing/Support (12)
- Flip 3D, filtro por domínio, embaralhar, atalhos de teclado (espaço vira, ←/→ navega, K = já sei, R = revisar)

**Simulado**
- 85 questões de múltipla escolha/múltipla resposta no banco, no estilo da prova real
- **Simulado completo**: sorteia 65 questões na mesma proporção de peso do exame (D1:16 D2:19 D3:22 D4:8), com cronômetro de 90 minutos e nota final em escala 100–1000 (mínimo 700 pra passar)
- **Prática por domínio**: até 20 questões de um domínio específico, sem cronômetro
- Alternativas embaralhadas a cada simulado (a posição da resposta certa não se repete)
- Explicação exibida após confirmar cada resposta

**Pontos fracos**
- Combina o progresso dos flashcards (cards marcados "já sei" vs "revisar") com o desempenho acumulado nos simulados
- Mostra os domínios ordenados do mais fraco pro mais forte, com recomendação do que fazer em cada um

**Glossário**
- ~80 termos e siglas mais cobrados (IAM, VPC, RTO/RPO, CapEx/OpEx, etc.), com busca em tempo real

**Resumo (cheat sheet)**
- Pontos-chave condensados por domínio, pra revisão rápida nos últimos dias antes da prova
- Dicas práticas pro dia do exame

Tudo salvo no navegador (localStorage) por padrão — e, se você configurar o Supabase (veja `SETUP.md`), também sincronizado na nuvem entre dispositivos via login com Google ou link mágico por e-mail.

**Login e sincronização entre dispositivos**
- Sem precisar de senha: entra com Google ou recebe um link mágico no e-mail
- Progresso (flashcards + estatísticas de simulado) sincroniza automaticamente entre qualquer navegador/computador logado na mesma conta
- Funciona normalmente mesmo sem configurar — fica só salvo localmente até você configurar o Supabase
- Passo a passo completo de configuração em **`SETUP.md`**

## Como rodar local

Só abrir o `index.html` no navegador. Não precisa servidor.

## Como publicar no Netlify

1. Crie um repo no GitHub com essa pasta (`index.html`, `app.js`, `cards-data.js`, `exam-questions.js`, `glossary-data.js`, `cheatsheet-data.js`, `supabase-config.js`)
2. (Opcional, mas recomendado) Siga o `SETUP.md` pra configurar login e sincronização antes de subir
3. No Netlify: **Add new site → Import an existing project** → conecte o repo
4. Build command: vazio. Publish directory: `.` (raiz)
5. Deploy — pronto, fica com deploy automático a cada push

## Como adicionar mais conteúdo

**Mais flashcards** — em `cards-data.js`:
```js
{id:101, d:3, q:"Pergunta aqui?", a:"Resposta aqui."},
```

**Mais questões de simulado** — em `exam-questions.js`:
```js
{id:86, d:2, type:"single", q:"Pergunta aqui?",
 options:["Opção A","Opção B","Opção C","Opção D"],
 correct:[0], explain:"Por que a opção A está certa."},
```
Use `type:"multi"` e `correct:[0,2]` (por exemplo) para questões de múltipla resposta.

**Mais termos no glossário** — em `glossary-data.js`:
```js
{term:"XYZ", def:"O que significa."},
```

`d` é sempre o domínio: 1 = Cloud Concepts, 2 = Security & Compliance, 3 = Cloud Tech & Services, 4 = Billing/Pricing/Support. `id` precisa ser único dentro de cada arquivo.

## Ideias pra evoluir (se quiser)

- Modo "só os que erro/marco pra revisar" nos flashcards
- Exportar progresso em JSON
- Histórico de simulados anteriores (não só o acumulado)
- Depois: versões pra SAA-C03 e outras certs, reaproveitando essa mesma estrutura
