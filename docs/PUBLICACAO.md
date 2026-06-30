# Checklist de publicação — Pelada Manager

Guia para levar o app às lojas via **Capacitor + Codemagic**.

## 1. Pré-requisitos (uma vez)

- [ ] Projeto Firebase criado, com **Auth** (**E-mail/senha**), **Firestore** e **Storage** habilitados.
- [ ] `.env` preenchido com as `VITE_FIREBASE_*` (e `VITE_PUBLIC_BASE_URL` com o domínio do deploy, para os links de compartilhamento).
- [ ] Regras e índices publicados:
      `firebase deploy --only firestore:rules,storage,firestore:indexes`
- [ ] **CORS do Storage** configurado se os logos/fotos forem usados em contexto externo
      (`gsutil cors set cors.json gs://SEU_BUCKET`). Os cards de PNG não dependem disso (usam monograma).

## 2. Build web + plataformas nativas

```bash
npm install
npm run build                 # gera dist/
npx cap add android           # 1ª vez
npx cap add ios               # 1ª vez (requer macOS)
npx cap sync                  # a cada build web
```

- App id: **`app.peladamanager`** (definido em `capacitor.config.ts`).
- Ícones/splash: gerar com `@capacitor/assets` antes do build de release.

## 3. Codemagic

- [ ] Configurar os grupos de variáveis no painel: `firebase`, `google_play`, `appstore`.
- [ ] Adicionar code signing (keystore Android; certificados/perfis iOS).
- [ ] Rodar os workflows de `codemagic.yaml` (`android-build`, `ios-build`, `web-build`).

## 4. Google Play — teste fechado (ATENÇÃO ⚠️)

A política exige, para contas novas de pessoa física:

- [ ] **Pelo menos 12 testers** participando do **teste fechado**…
- [ ] …de forma contínua por **no mínimo 14 dias** antes de poder solicitar produção.

**Ação prática:** recrute os 12+ testers do próprio fut (jogadores/organizadores)
e crie a lista de e-mails no Play Console **com antecedência** — o relógio dos 14
dias só começa quando o teste fechado está ativo com os testers de fato opt-in.

- [ ] Listagem da loja: nome, descrição curta/completa, screenshots (use os cards de
      estatística do app!), ícone 512px, feature graphic.
- [ ] Política de privacidade publicada (obrigatória — o app coleta e-mail/conta).
- [ ] Classificação indicativa e formulário de Data Safety preenchidos.

## 5. App Store (iOS)

- [ ] App Store Connect: ficha do app, screenshots por tamanho de tela, descrição.
- [ ] Privacy "Nutrition Labels" (dados coletados: conta/e-mail).
- [ ] TestFlight para teste interno/externo antes da submissão.

## 6. Smoke test antes de submeter

- [ ] Criar conta e login (e-mail/senha), redefinir senha, criar time, adicionar jogador, cadastrar jogo.
- [ ] Conferir agregados (V/E/D, artilharia, assistências, frequência) e gráficos.
- [ ] Editar e excluir um jogo → estatísticas revertem corretamente.
- [ ] Buscar o time por nome (modo anônimo) e abrir em modo leitura.
- [ ] Gerar e compartilhar um card de estatística (PNG).
- [ ] Modo avião: lançar um jogo offline e confirmar sync ao reconectar (badge "não sincronizado").
