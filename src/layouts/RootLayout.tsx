import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'

export default function RootLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <motion.main
        key={location.pathname}
        {...pageTransition}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
