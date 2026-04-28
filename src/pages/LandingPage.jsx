import { Link } from 'react-router-dom';
import Header from '@components/Header';
import { MST_REFERENCE } from '@utils/constants';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload',
    description: 'Drop a well-lit, front-facing photo. Your image stays on your device — we never upload it.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Analyse',
    description: 'Our on-device AI maps your skin tone to the Monk Skin Tone Scale and detects your undertone.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.3 24.3 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.214.107a2.25 2.25 0 011.279 2.025V21" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Shop',
    description: 'Get personalised shades from MAC, Maybelline, L\'Oréal, and Rare Beauty — try them on virtually.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center flex flex-col items-center gap-6"
        >
          <span className="inline-block px-4 py-1 bg-brand-light text-brand text-xs rounded-full tracking-wider uppercase">
            AI-Powered Shade Matching
          </span>
          <h1
            id="hero-heading"
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-charcoal leading-tight"
          >
            Find Your
            <br />
            <span className="text-brand">Perfect Shade</span>
          </h1>
          <p className="text-muted text-lg max-w-xl leading-relaxed">
            Upload a photo, let our AI detect your skin tone and undertone, then get personalised
            makeup recommendations from your favourite brands — all in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              to="/app"
              id="hero-cta"
              className="px-8 py-3.5 bg-brand text-white font-body rounded-full hover:bg-brand/90 active:scale-[0.98] transition-all duration-150 text-sm"
            >
              Analyse My Skin Tone
            </Link>
            <Link
              to="/history"
              id="hero-history-link"
              className="px-8 py-3.5 border border-brand-light text-muted font-body rounded-full hover:border-brand/40 hover:text-charcoal transition-colors text-sm"
            >
              View Past Analyses
            </Link>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Your photo never leaves your device
          </p>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="bg-white border-y border-brand-light py-20 px-6"
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs text-muted uppercase tracking-widest text-center mb-3">How it works</p>
            <h2
              id="how-heading"
              className="font-display text-4xl text-charcoal text-center mb-14"
            >
              Three steps to your perfect match
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map(({ step, title, description, icon }) => (
                <div
                  key={step}
                  className="flex flex-col gap-4 p-6 border border-brand-light rounded-2xl hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
                      {icon}
                    </div>
                    <span className="font-display text-3xl text-brand-light font-semibold select-none">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-charcoal">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MST Swatch Strip ──────────────────────────────────────────────── */}
        <section
          id="mst-swatches"
          aria-labelledby="mst-heading"
          className="max-w-5xl mx-auto px-6 py-20"
        >
          <p className="text-xs text-muted uppercase tracking-widest text-center mb-3">Monk Skin Tone Scale</p>
          <h2
            id="mst-heading"
            className="font-display text-4xl text-charcoal text-center mb-4"
          >
            Every shade, covered
          </h2>
          <p className="text-muted text-sm text-center mb-12 max-w-md mx-auto">
            Our model was trained across all 10 tones of the Monk Skin Tone Scale — from lightest to deepest.
          </p>

          <div className="flex flex-wrap justify-center gap-4" role="list" aria-label="Monk Skin Tone Scale reference">
            {MST_REFERENCE.map((tone) => (
              <div
                key={tone.index}
                role="listitem"
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-14 h-14 rounded-full border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: tone.hex }}
                  aria-label={`${tone.label}: ${tone.description}`}
                />
                <p className="text-xs text-muted text-center leading-tight">
                  <span className="block font-medium text-charcoal">{tone.label}</span>
                  <span className="block">{tone.description}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <section className="bg-brand py-20 px-6 text-center" aria-label="Call to action">
          <h2 className="font-display text-4xl text-white mb-4">Ready to find your match?</h2>
          <p className="text-brand-light text-sm mb-8 max-w-sm mx-auto">
            Upload a photo and get personalised results in under 5 seconds.
          </p>
          <Link
            to="/app"
            id="bottom-cta"
            className="inline-block px-8 py-3.5 bg-white text-brand font-body text-sm rounded-full
              hover:bg-cream active:scale-[0.98] transition-all duration-150"
          >
            Get Started Free
          </Link>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-light py-8 px-6 text-center">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} ShadeSense · Built with ❤️ for every skin tone
        </p>
      </footer>
    </div>
  );
}
