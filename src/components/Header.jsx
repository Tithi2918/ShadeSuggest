import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/app', label: 'Try It' },
  { to: '/history', label: 'History' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-brand-light anim-fade-down">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-[1.6rem] font-semibold text-brand tracking-wide hover:opacity-80 transition-opacity flex items-center gap-1.5"
          aria-label="ShadeSense home"
        >
          <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" aria-hidden="true" />
          ShadeSense
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-sm font-body tracking-wide transition-colors duration-200 ${
                  isActive
                    ? 'text-brand font-medium border-b border-brand pb-0.5'
                    : 'text-muted hover:text-charcoal'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/app"
            id="header-cta"
            className="ml-2 px-4 py-1.5 border border-brand text-brand text-sm font-body rounded-full hover:bg-brand hover:text-white transition-all duration-200"
          >
            Analyse My Skin
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-charcoal transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-charcoal transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-charcoal transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
          />
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {menuOpen && (
        <nav
          className="md:hidden border-t border-brand-light bg-cream px-6 py-4 flex flex-col gap-4"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm font-body py-1 transition-colors ${
                  isActive ? 'text-brand font-medium' : 'text-muted hover:text-charcoal'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/app"
            id="mobile-cta"
            onClick={() => setMenuOpen(false)}
            className="mt-1 px-5 py-2 bg-brand text-white text-sm text-center font-body rounded-full hover:bg-brand/90 transition-colors"
          >
            Analyse My Skin
          </Link>
        </nav>
      )}
    </header>
  );
}
