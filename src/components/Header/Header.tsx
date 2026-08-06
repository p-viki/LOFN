import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Container } from '@/ui/Container'
import { navItems } from '@/data/nav'
import { useUIStore } from '@/stores/uiStore'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/utils/cn'

export function Header() {
  const location = useLocation()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border-subtle backdrop-blur-md bg-bg-base/60">
      <Container size="lg">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="font-mono text-lg font-bold tracking-tighter text-text-primary hover:text-gradient transition-colors"
          >
            LOFN
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-4 py-2 text-sm transition-colors',
                    isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 h-px w-8 bg-gradient"
                      style={{ left: 'calc(50% - 1rem)' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-border-subtle bg-bg-surface"
          >
            <Container size="lg">
              <div className="flex flex-col py-4 gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-4 py-3 text-base rounded-sm transition-colors',
                        isActive
                          ? 'text-text-primary bg-bg-elevated'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
