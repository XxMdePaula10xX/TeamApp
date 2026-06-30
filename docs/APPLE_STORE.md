# Publicar na App Store (iOS) — Pelada Manager

Guia para subir o app na App Store usando **Codemagic** (Mac na nuvem) —
você **não precisa de um Mac**. App id: **`app.peladamanager`**.

## 0. Custos e pré-requisitos (uma vez)
- [ ] **Apple Developer Program** — **US$ 99/ano** (https://developer.apple.com/programs/). Obrigatório.
- [ ] Conta no **Codemagic** (https://codemagic.io) conectada a este repositório no GitHub.
- [ ] **Política de privacidade publicada** (uma URL). O app coleta e-mail/conta → a Apple exige. Pode ser uma página simples no próprio site/Firebase Hosting.

## 1. App Store Connect — criar o app
1. https://appstoreconnect.apple.com → **Meus Apps** → **+** → **Novo app**.
2. Plataforma **iOS**, nome **Pelada Manager**, idioma **Português (Brasil)**.
3. **Bundle ID**: `app.peladamanager`. (Se não aparecer na lista, registre antes em
   *Certificates, Identifiers & Profiles → Identifiers → +* — ou deixe a
   assinatura automática do Codemagic criar com `--create`.)
4. Depois de criado, anote o **Apple ID numérico** do app
   (*App Information → General Information → Apple ID*, ex.: `6480000000`).

## 2. Chave da API do App Store Connect (para o Codemagic assinar/publicar)
1. App Store Connect → **Users and Access → Integrations → App Store Connect API**.
2. **Generate API Key** com função **App Manager** (ou Admin).
3. Baixe o arquivo **`.p8`** (só dá pra baixar uma vez) e anote o **Key ID** e o **Issuer ID**.

## 3. Codemagic — configurar
1. Adicione o app (este repositório) no Codemagic.
2. **Teams/App settings → Integrations → App Store Connect** → cole a chave (`.p8` + Key ID + Issuer ID) e **dê um nome** à integração.
3. No `codemagic.yaml` (workflow `ios-appstore`), ajuste:
   - `integrations.app_store_connect: CODEMAGIC_ASC_KEY` → use o **nome** que você deu à integração.
   - `APP_STORE_APPLE_ID: 0000000000` → o **Apple ID numérico** do passo 1.
4. Crie o **grupo de variáveis `firebase`** com as `VITE_FIREBASE_*` (mesmas do `.env`)
   e, opcional, `VITE_PUBLIC_BASE_URL`.
5. **Commite `assets/icon.png`** (1024×1024) — ver §5.

## 4. Rodar o build
- No Codemagic, rode o workflow **`iOS — App Store`**.
- Ele: instala deps → build web → `cap add ios` → gera ícones → `cap sync` →
  **assinatura automática** → incrementa o build number → gera o `.ipa` →
  **publica no TestFlight**.
- Quando terminar, o build aparece em **TestFlight** (App Store Connect).

## 5. Ícone (atenção ⚠️)
- A arte-fonte vai em **`assets/icon.png`**, **1024×1024**, **quadrado**, **SEM transparência**
  e **sem cantos arredondados** (preencha o quadrado inteiro de cor sólida — a Apple
  **rejeita** ícone com canal alfa). O `@capacitor/assets` gera os demais tamanhos.

## 6. Ficha da loja + submeter para revisão
No App Store Connect, na versão do app:
- [ ] **Screenshots** (obrigatório iPhone 6.7" = 1290×2796). Dica: use os cards de estatística e telas do app.
- [ ] Descrição, palavras-chave, categoria (ex.: Esportes), subtítulo.
- [ ] **Classificação etária** (questionário).
- [ ] **App Privacy** (Data Safety): declare que coleta **e-mail/identificador de conta** (autenticação).
- [ ] **URL da política de privacidade** (do passo 0).
- [ ] Selecione o **build** do TestFlight.
- [ ] **Submeter para revisão**. A análise costuma levar de algumas horas a alguns dias.

## Notas
- O `ios/` é gerado pelo Codemagic a cada build (não versionamos o projeto nativo);
  a assinatura automática dispensa commitar certificados.
- Para testar com gente antes de publicar: **TestFlight** (interno: até 100; externo: até 10.000, com uma revisão leve da Apple).
- Mesma identidade do app (e-mail/senha, Firestore) do site — nada muda no backend.
