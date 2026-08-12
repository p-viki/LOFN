import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/tests', label: '测试题' },
  { to: '/games', label: '心理游戏' },
  { to: '/articles', label: '文章' },
]

export default function RootLayout() {
  const location = useLocation()

  return (
    <div className="lofn-root min-h-screen flex flex-col bg-bg-base">
      {/* 顶部一级模块导航 */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/80 backdrop-blur">
        <nav className="mx-auto w-full max-w-7xl px-4 xs:px-5 sm:px-6 md:px-8 flex items-center gap-4 sm:gap-8 h-14">
          <Link to="/" className="shrink-0 font-semibold tracking-tight text-text-primary">
            LOFN
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const active =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-md text-sm transition-colors',
                    active
                      ? 'text-text-primary bg-bg-elevated'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <motion.main
        key={location.pathname}
        {...pageTransition}
        className="lofn-main flex-1"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
