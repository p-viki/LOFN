import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import RootLayout from '@/layouts/RootLayout'
import HomePage from '@/routes/index'
import GamesPage from '@/routes/games'
import ArticlesPage from '@/routes/articles'
import TestListPage from '@/features/tests/pages/TestListPage'
import TestRunnerPage from '@/features/tests/pages/TestRunnerPage'

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tests" element={<TestListPage />} />
          <Route path="tests/:id" element={<TestRunnerPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
