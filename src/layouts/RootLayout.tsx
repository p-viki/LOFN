import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'

const NAV_ITEMS = [
  { to: '/tests', label: '测试题' },
  { to: '/games', label: '心理游戏' },
  { to: '/articles', label: '文章' },
  { to: '/sketch-to-image', label: '草图生图' },
  { to: '/pixel-studio', label: '像素工坊' },
]

export default function RootLayout() {
  const location = useLocation()
  const hideHeader = location.pathname === '/topstage'

  return (
    <div className="lofn-root">
      {/* 顶部一级模块导航 */}
      {!hideHeader && <header className="lofn-header">
        <nav className="lofn-nav">
          <Link to="/" className="lofn-nav__brand">
            LOFN
          </Link>
          <div className="lofn-nav__items">
            {NAV_ITEMS.map((item) => {
              const active =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="lofn-nav__link"
                  data-active={active || undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>}

      <motion.main
        key={location.pathname}
        {...pageTransition}
        className="lofn-main"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
