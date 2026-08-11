import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import RootLayout from '@/layouts/RootLayout'
import HomePage from '@/routes/index'
import QuizPage from '@/routes/quiz'
import QuizDemoPage from '@/routes/quiz-demo'
import LsasPage from '@/routes/lsas'

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz-demo" element={<QuizDemoPage />} />
          <Route path="lsas" element={<LsasPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
