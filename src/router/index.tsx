import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { AccountPage } from '@/pages/AccountPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SearchPage } from '@/pages/SearchPage'
import { TeamFormPage } from '@/pages/TeamFormPage'
import { PlayerFormPage } from '@/pages/PlayerFormPage'
import { GameFormPage } from '@/pages/GameFormPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TeamLayout } from '@/pages/team/TeamLayout'
import { OverviewTab } from '@/pages/team/OverviewTab'
import { ResenhaTab } from '@/pages/team/ResenhaTab'
import { SquadTab } from '@/pages/team/SquadTab'
import { GamesTab } from '@/pages/team/GamesTab'
import { StatsTab } from '@/pages/team/StatsTab'

/**
 * Rotas (PRD §7). Telas públicas: /login, /buscar e a página do time
 * (modo leitura). Rotas de edição ficam atrás de <ProtectedRoute>.
 * Conteúdo das páginas é placeholder no Sprint 0 — preenchido nos
 * Sprints 1–3.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      // Home / Meus Times (exige login).
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      // Busca pública (acessível a anônimos).
      { path: 'buscar', element: <SearchPage /> },

      // Conta do usuário (exige login).
      {
        path: 'conta',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },

      // Notificações (exige login).
      {
        path: 'notificacoes',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },

      // Criar time (dono).
      {
        path: 'time/novo',
        element: (
          <ProtectedRoute>
            <TeamFormPage mode="create" />
          </ProtectedRoute>
        ),
      },

      // Página do time com abas internas (modo leitura é público).
      {
        path: 'time/:teamId',
        element: <TeamLayout />,
        children: [
          { index: true, element: <OverviewTab /> },
          { path: 'elenco', element: <SquadTab /> },
          { path: 'jogos', element: <GamesTab /> },
          { path: 'estatisticas', element: <StatsTab /> },
          { path: 'resenha', element: <ResenhaTab /> },
        ],
      },

      // Edições (dono).
      {
        path: 'time/:teamId/editar',
        element: (
          <ProtectedRoute>
            <TeamFormPage mode="edit" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'time/:teamId/jogador/novo',
        element: (
          <ProtectedRoute>
            <PlayerFormPage mode="create" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'time/:teamId/jogador/:playerId/editar',
        element: (
          <ProtectedRoute>
            <PlayerFormPage mode="edit" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'time/:teamId/jogo/novo',
        element: (
          <ProtectedRoute>
            <GameFormPage mode="create" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'time/:teamId/jogo/:gameId/editar',
        element: (
          <ProtectedRoute>
            <GameFormPage mode="edit" />
          </ProtectedRoute>
        ),
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
