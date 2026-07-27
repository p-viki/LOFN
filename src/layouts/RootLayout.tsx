import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'
import { pageTransition } from '@/lib/motion'

export default function RootLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Header />
      <motion.main
        key={location.pathname}
        {...pageTransition}
        className="flex-1 pt-16"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
