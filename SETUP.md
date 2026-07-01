# Configurar login e sincronização entre dispositivos (Supabase)

Sem isso, o app funciona normalmente, só que o progresso fica preso a um navegador/computador. Com isso, o progresso acompanha a conta — entra no celular, no notebook do trabalho, em qualquer navegador, e o progresso é o mesmo.

Tudo isso é gratuito no plano free do Supabase pra esse uso (um app pessoal de estudo).

## 1. Criar o projeto Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) (dá pra entrar com GitHub)
2. **New project** → escolha um nome, uma senha de banco (guarde, mas não vai precisar dela aqui) e a região mais próxima (ex: South America - São Paulo)
3. Espere uns 2 minutos o projeto provisionar

## 2. Criar a tabela de progresso

No painel do projeto, vá em **SQL Editor** → **New query**, cole isso e rode (Run):

```sql
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  flashcards jsonb not null default '{}'::jsonb,
  exam_stats jsonb not null default '{}'::jsonb,
  course_progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);
```

> **Já criou essa tabela antes?** Só rode este comando extra no SQL Editor pra adicionar a nova coluna sem perder nada do que já existe:
> ```sql
> alter table public.user_progress add column if not exists course_progress jsonb not null default '{}'::jsonb;
> ```

Isso cria a tabela e garante (via Row Level Security) que cada pessoa só consegue ler/escrever a própria linha — mesmo que mil pessoas usem o mesmo app publicado, ninguém vê o progresso de ninguém.

## 3. Pegar as credenciais e colar no projeto

No painel: **Settings → API**

- Copie **Project URL** → cole em `SUPABASE_URL` no arquivo `supabase-config.js`
- Copie a chave **anon public** → cole em `SUPABASE_ANON_KEY` no mesmo arquivo

A anon key é segura pra deixar exposta no front-end — ela só funciona dentro das regras de RLS que você acabou de criar.

## 4. Habilitar o domínio do Netlify (importante)

No painel: **Authentication → URL Configuration**

- Em **Site URL**, coloque a URL do seu site no Netlify (ex: `https://seu-site.netlify.app`)
- Em **Redirect URLs**, adicione a mesma URL

Sem isso, o login com e-mail/senha e com Google redirecionam errado depois do deploy.

## 5. Login por e-mail e senha — já funciona sem configurar nada a mais

O cadastro com e-mail e senha (`signUp` / `signInWithPassword`) já vem habilitado por padrão no Supabase. Só uma recomendação:

- Vá em **Authentication → Providers → Email** e desative o toggle **Confirm email**. Sem isso, quem cria conta precisa clicar num e-mail de confirmação antes de conseguir entrar — desativando, a pessoa já entra na hora, sem depender de e-mail chegar.

## 6. Login com Google (opcional, dá mais trabalho)

Se quiser o botão "Entrar com Google" funcionando:

1. Vá em [Google Cloud Console](https://console.cloud.google.com/) → crie um projeto (ou use um existente)
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
3. Tipo de aplicativo: **Web application**
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
   (troque `SEU-PROJETO` pelo ID do seu projeto Supabase — está na Project URL)
5. Copie o **Client ID** e o **Client Secret** gerados
6. No Supabase: **Authentication → Providers → Google** → habilite, cole Client ID e Client Secret, salve

Se você não fizer esse passo, o botão "Entrar com Google" simplesmente não vai funcionar — mas o cadastro com e-mail e senha continua funcionando normalmente como alternativa, sem precisar disso.

## 7. Deploy no Netlify

Sobe os arquivos pro GitHub (incluindo o `supabase-config.js` já preenchido) e conecta no Netlify, exatamente como antes — sem build step, publish directory `.`.

⚠️ Como o `supabase-config.js` vai pro repositório com a URL e a anon key, se o repo for público qualquer um pode ver essas credenciais — mas isso é esperado e seguro, porque a proteção real está nas políticas de RLS do banco (passo 2), não em esconder essas chaves.

## Como funciona, na prática

- Sem login: tudo salvo só no `localStorage` do navegador (como já era antes)
- Ao criar conta ou logar pela primeira vez num navegador: se a nuvem ainda não tem nada salvo pra essa conta, o progresso local desse navegador é enviado pra nuvem
- Ao logar num navegador/dispositivo diferente com a mesma conta: o progresso da nuvem substitui o local — ou seja, a nuvem é sempre a fonte da verdade entre dispositivos depois do primeiro envio
- Toda vez que você marca um flashcard (de prova ou do curso) ou termina um simulado estando logado, o progresso é salvo automaticamente na nuvem (com um pequeno delay de ~1s)
