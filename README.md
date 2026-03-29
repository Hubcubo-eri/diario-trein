# Diário de Treino — Cubo Saúde 💪

App pessoal de diário de treino e nutrição com Supabase.

---

## PASSO A PASSO PARA DEPLOY NA VERCEL

### 1. Criar repositório no GitHub

1. Acesse [github.com](https://github.com) (crie conta se não tiver)
2. Clique no **+** no canto superior direito → **New repository**
3. Nome: `diario-treino`
4. Deixe **Public**
5. **NÃO** marque "Add a README file"
6. Clique em **Create repository**

### 2. Subir os arquivos

No **Terminal** do seu Mac, rode esses comandos um por um:

```bash
cd ~/Downloads/diario-treino
npm install
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO_GITHUB/diario-treino.git
git push -u origin main
```

> Troque `SEU_USUARIO_GITHUB` pelo seu usuário do GitHub.

### 3. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **"Add New..."** → **"Project"**
3. Vai aparecer seu repositório `diario-treino` — clique em **Import**
4. Em **Framework Preset**, selecione **Vite**
5. Clique em **Deploy**
6. Espere ~1 minuto — vai gerar um link tipo `diario-treino-xxx.vercel.app`

### 4. Salvar no iPhone como app

1. Abra o link da Vercel no **Safari** do iPhone
2. Toque no ícone de **compartilhar** (quadrado com seta pra cima)
3. Toque em **"Adicionar à Tela de Início"**
4. Pronto! Agora abre como um app

---

## Dados

- ✅ Salvos no **Supabase** (banco de dados na nuvem)
- ✅ Nunca perde os dados
- ✅ Acessa de qualquer dispositivo
- 💾 Botão de backup no Histórico exporta JSON

## Quando o treino/dieta mudar

Edite o arquivo `src/data.js` — ou me peça aqui no Claude que eu gero a versão atualizada.
