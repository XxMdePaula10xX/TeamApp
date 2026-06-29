# ⚽ Pelada Manager

Gestor de times amadores de futebol. Cadastre times, jogadores e jogos com
gols/assistências individuais, e acompanhe **artilharia, assistências,
frequência e aproveitamento** em gráficos — igual time profissional.
Qualquer pessoa pode buscar um time e ver suas estatísticas públicas.

> Status: **Sprint 0 — Setup** concluído. App scaffold roda, builda e está
> pronto para o desenvolvimento do núcleo (Sprint 1).

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | Vite + React 18 + TypeScript |
| Empacotamento nativo | Capacitor (Android/iOS) |
| Backend | Firebase Firestore (cache offline) |
| Auth | Firebase Auth (Google + e-mail/senha) |
| Arquivos | Firebase Storage |
| Gráficos | Recharts |
| Roteamento | React Router |
| Estado | Zustand |
| UI | Tailwind CSS |
| CI/CD | Codemagic |

## Começando

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o Firebase
cp .env.example .env
#   …e preencha as variáveis VITE_FIREBASE_* com as credenciais do seu
#   projeto (Firebase Console > Configurações do projeto > Seus apps > Web).

# 3. Rodar em desenvolvimento
npm run dev        # http://localhost:5173

# Outros scripts
npm run build      # typecheck + build de produção (gera dist/)
npm run preview    # serve o build de produção
npm run typecheck  # apenas checagem de tipos
npm run lint       # ESLint
```

### Firebase

O app espera um projeto Firebase com **Authentication** (provedores Google e
E-mail/senha), **Cloud Firestore** e **Storage** habilitados. As regras de
segurança estão versionadas:

- `firestore.rules` — leitura pública, escrita restrita ao dono (`ownerId`
  imutável).
- `storage.rules` — leitura pública de imagens, upload só autenticado (≤ 5 MB).
- `firestore.indexes.json` — índices para a lista/filtro de jogos.

Deploy das regras (requer Firebase CLI):

```bash
firebase deploy --only firestore:rules,storage,firestore:indexes
```

### Mobile (Capacitor)

```bash
npm run build
npx cap add android      # cria o projeto nativo Android (uma vez)
npx cap add ios          # idem iOS (requer macOS)
npx cap sync             # copia o build web para os projetos nativos
```

App id: `app.peladamanager`. A publicação é feita via **Codemagic**
(`codemagic.yaml`) — configure os grupos de variáveis `firebase`,
`google_play` e `appstore` no painel do Codemagic.

## Estrutura

```
src/
  lib/firebase.ts        Inicialização do Firebase (Auth/Firestore/Storage)
  types/models.ts        Modelo de dados (Firestore) — fonte da verdade
  utils/normalize.ts     Normalização de nome p/ busca por prefixo
  utils/stats.ts         Cálculo de agregados (funções puras, PRD §9)
  store/authStore.ts     Estado de autenticação (Zustand)
  components/            Layout, ProtectedRoute, Placeholder
  pages/                 Telas (Login, Home, Busca, formulários)
  pages/team/            Página do time + abas (Visão geral/Elenco/Jogos/Stats)
  router/index.tsx       Rotas (PRD §7)
```

## Modelo de dados (resumo)

```
users/{userId}
teams/{teamId}                      (stats agregadas embutidas)
teams/{teamId}/players/{playerId}   (stats agregadas embutidas)
teams/{teamId}/games/{gameId}       (events[] com gols/assistências)
teams/{teamId}/competitions/{competitionId}
```

Agregados (`team.stats`, `player.stats`) são **desnormalizados** e
recalculados no client dentro de transações ao salvar/editar/excluir jogos.
Ao editar/excluir, a contribuição antiga é **revertida** antes de reaplicar a
nova (ver `src/utils/stats.ts`).

## Roadmap

- [x] **Sprint 0 — Setup**: projeto, Firebase, Capacitor, regras, CI, scaffold.
- [ ] **Sprint 1 — Núcleo**: auth, CRUD de time/jogador/jogo + agregados.
- [ ] **Sprint 2 — Estatísticas**: visão geral, artilharia, assistências,
      frequência, filtros.
- [ ] **Sprint 3 — Busca e modo público**: busca por nome, página pública,
      deep links.
- [ ] **Sprint 4 — Viralização e polimento**: cards PNG, empty states,
      offline, publicação.
