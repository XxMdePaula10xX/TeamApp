# Hospedar no GitHub Pages — passo a passo

Hospeda o app (estático) de graça em `https://SEU-USUARIO.github.io/SEU-REPO/`.
O projeto já está preparado: `base` e roteamento por **hash** são ativados na
build do Pages pelo workflow `.github/workflows/pages.yml`.

> ⚠️ No Pages as URLs ficam com `#` (ex.: `.../#/time/123`) — é o necessário
> para deep links funcionarem sem servidor. Os links de Compartilhar/QR já
> saem com o `#` automaticamente.

## 1. Criar o repositório público
1. No GitHub: **New repository** → nome (ex.: `clubmanager`) → **Public** → *Create*.
2. Não precisa adicionar README/license.

## 2. Enviar o código para o novo repositório
Na pasta do projeto (no seu PC):

```bash
# adiciona o novo repo como um segundo remoto chamado "public"
git remote add public https://github.com/SEU-USUARIO/SEU-REPO.git

# envia o branch atual como "main" no repo público
git push public claude/app-prd-review-mbfm2v:main
```
> Para atualizar o site depois, repita o `git push public <seu-branch>:main`.

## 3. Commitar as credenciais do Firebase (`.env.production`)
A build no GitHub roda no servidor, então precisa das `VITE_FIREBASE_*`.
As chaves **Web** do Firebase são **seguras de expor** (a segurança vem das
regras), então pode commitar. Crie o arquivo **`.env.production`** na raiz:

```
VITE_FIREBASE_API_KEY=AIzaSyCAaPWv3-kJK7kM7e_PkjMKPtwQihp4kSg
VITE_FIREBASE_AUTH_DOMAIN=teamapp-a7e30.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=teamapp-a7e30
VITE_FIREBASE_STORAGE_BUCKET=teamapp-a7e30.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=635038748461
VITE_FIREBASE_APP_ID=1:635038748461:web:4c93ec57e3987a80740da4
```
E envie:
```bash
git add .env.production
git commit -m "chore: env de producao para o GitHub Pages"
git push public claude/app-prd-review-mbfm2v:main
```
> (Não quer commitar as chaves? Dá pra usar *Settings → Secrets and variables →
> Actions → Variables* e referenciá-las no workflow. Commitar é o mais simples.)

## 4. Ligar o GitHub Pages
No repositório público: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

## 5. Rodar o deploy
- O workflow **Deploy GitHub Pages** roda sozinho a cada push no `main`
  (ou rode manualmente em **Actions → Deploy GitHub Pages → Run workflow**).
- Quando terminar, o site fica em:
  **`https://SEU-USUARIO.github.io/SEU-REPO/`** (link aparece na aba Actions/Pages).

## 6. Autorizar o domínio no Firebase (recomendado)
Firebase Console → **Authentication → Settings → Authorized domains** →
**Add domain** → `SEU-USUARIO.github.io`.
> Login por e-mail/senha costuma funcionar sem isso, mas autorizar evita
> surpresas (e é obrigatório se um dia adicionar login Google).

## 7. Testar
Abra a URL no celular/PC → criar conta → criar time → cadastrar jogo.
Os links de Compartilhar/QR apontarão para `https://SEU-USUARIO.github.io/SEU-REPO/#/time/...`.

## Observações
- **Ícone PWA**: em subpasta (`/repo/`), a instalação "adicionar à tela inicial"
  pode não pegar o ícone/escopo perfeitamente. Para PWA 100%, prefira o
  **Firebase Hosting** (raiz) ou um **domínio próprio**. O app em si funciona
  normalmente no Pages.
- **Dica**: se criar um repo chamado exatamente `SEU-USUARIO.github.io`, o site
  fica na raiz (`https://SEU-USUARIO.github.io/`) — aí nem precisa do base path
  (mas o hash router continua sendo o mais simples).
- Os mesmos dados/login do Firebase valem aqui e em qualquer outro host.
