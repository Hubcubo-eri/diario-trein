# Garmin → Diário

Um GitHub Action (`.github/workflows/garmin-sync.yml`) roda a cada 2h, puxa do
Garmin Connect os dados do dia e grava no Supabase. O app mostra na aba **Dia**:
passos, sono, FC de repouso, Body Battery, estresse, calorias e as atividades
do relógio.

Usa a biblioteca **não oficial** [`garminconnect`](https://github.com/cyberjunky/python-garminconnect).
Pode parar de funcionar se a Garmin mudar o login. Quando isso acontecer,
geralmente basta atualizar a biblioteca e refazer o passo 1.

## Configuração (uma vez)

### 1. Gerar o token no seu computador

```bash
cd diario-trein
python3 -m venv .venv && source .venv/bin/activate
pip install -r garmin/requirements.txt
python garmin/login_local.py
```

O script pede seu e-mail, sua senha e o código 2FA (se você usar) e imprime
dois valores. **A senha não é salva em lugar nenhum.**

### 2. Colar os valores nos Secrets do GitHub

No repositório, vá em **Settings → Secrets and variables → Actions → New repository secret**:

| Nome               | Valor                              |
|--------------------|------------------------------------|
| `GARMIN_TOKENS`    | a linha do token (começa com `{`)  |
| `GARMIN_TOKEN_KEY` | a chave impressa logo abaixo       |

### 3. Rodar a primeira vez

Vá em **Actions → Garmin → Diário → Run workflow**. Para importar o histórico,
preencha *data inicial* (ex.: `2026-03-01`).

## Como funciona

- Cada dia vira uma linha `garmin_AAAA-MM-DD` na tabela `days`. O app só **lê**
  essa linha, então o Garmin nunca apaga o que você digitou.
- Calorias: o valor que você digitar no app tem prioridade. Se o campo estiver
  vazio, o app usa o do Garmin.
- Atividades do relógio aparecem com o selo ⌚. Toque para ajustar o tipo e
  adicionar notas (vira um registro seu), ou em **Ocultar** para tirar do dia.
- O token renovado é salvo **criptografado** na linha `garmin_token` com a
  `GARMIN_TOKEN_KEY`, então só o Action consegue usá-lo.
- O log do Action mostra apenas contagens, nunca seus dados.

## Se parar de funcionar

O Action falha com “Não foi possível entrar no Garmin”. Refaça os passos 1 e 2.
Se continuar falhando, atualize a biblioteca com `pip install -U garminconnect`
e ajuste o `requirements.txt`.

> O GitHub desativa Actions agendados em repositórios sem nenhum commit por 60
> dias. Se isso acontecer, é só reativar na aba **Actions**.
