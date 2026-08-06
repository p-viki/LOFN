import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import RootLayout from '@/layouts/RootLayout'
import HomePage from '@/routes/index'
import AboutPage from '@/routes/about'
import ProjectsPage from '@/routes/projects'
import ProjectDetailPage from '@/routes/projects/detail'
import BlogPage from '@/routes/blog'
import BlogDetailPage from '@/routes/blog/detail'
import PlaygroundPage from '@/routes/playground'
import QuizPage from '@/routes/quiz'
import ToolsPage from '@/routes/tools'
import ColorTool from '@/components/tools/ColorTool'
import QuizDemoPage from '@/routes/quiz-demo'
import ContactPage from '@/routes/contact'
import NotFoundPage from '@/routes/404'

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/color" element={<ColorTool />} />
          <Route path="quiz-demo" element={<QuizDemoPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
