import { Link } from 'react-router-dom';
import Header from '@components/Header';
import { MST_REFERENCE } from '@utils/constants';
import { useInView } from '@hooks/useInView';

// ── Reusable scroll-reveal wrapper ──────────────────────────────────────────
function Reveal({ children, className = '', delay = 0, from = 'up' }) {
  const [ref, inView] = useInView();

  const base = 'transition-all ease-out';
  const duration = 'duration-700';

  const variants = {
    up:    { hidden: 'opacity-0 translate-y-8',  visible: 'opacity-100 translate-y-0' },
    left:  { hidden: 'opacity-0 -translate-x-10', visible: 'opacity-100 translate-x-0' },
    right: { hidden: 'opacity-0 translate-x-10',  visible: 'opacity-100 translate-x-0' },
    scale: { hidden: 'opacity-0 scale-90',         visible: 'opacity-100 scale-100' },
    fade:  { hidden: 'opacity-0',                  visible: 'opacity-100' },
  };

  const { hidden, visible } = variants[from] ?? variants.up;

  return (
    <div
      ref={ref}
      className={`${base} ${duration} ${inView ? visible : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload',
    description: 'Drop a well-lit, front-facing photo. Your image stays entirely on your device — we never upload it.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Analyse',
    description: 'Our on-device AI maps your skin tone to the Monk Skin Tone Scale and detects your warm, cool, or neutral undertone.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Shop',
    description: "Get personalised shades from MAC, Maybelline, L'Oréal, and Rare Beauty — then try them on virtually before you buy.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
  },
];

const HERO_SWATCHES = MST_REFERENCE.map((t) => t.hex);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="w-full bg-warm border-b border-brand-light/60"
        >
          <div className="max-w-7xl mx-auto px-8 lg:px-16 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left — staggered on-load entrance */}
            <div className="flex flex-col gap-7">
              <span className="anim-fade-down anim-delay-75 inline-flex items-center gap-2 w-fit px-3.5 py-1.5 bg-white text-brand text-xs rounded-full tracking-widest uppercase font-medium border border-brand-light shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                AI-Powered Shade Matching
              </span>

              <h1
                id="hero-heading"
                className="anim-fade-up anim-delay-150 font-display text-5xl sm:text-6xl lg:text-7xl text-charcoal leading-[1.08] tracking-tight"
              >
                Find Your
                <br />
                <em className="not-italic anim-shimmer">Perfect</em>
                <span className="text-charcoal"> Shade</span>
              </h1>

              <p className="anim-fade-up anim-delay-250 text-muted text-base lg:text-lg leading-relaxed max-w-md">
                Upload a photo. Our on-device AI detects your skin tone and undertone,
                then matches you to personalised shades from the world's best makeup brands.
              </p>

              <div className="anim-fade-up anim-delay-350 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/app"
                  id="hero-cta"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand text-white font-body text-sm rounded-full hover:bg-brand/90 hover:gap-3 active:scale-[0.97] transition-all duration-200 shadow-sm"
                >
                  Analyse My Skin Tone
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  to="/history"
                  id="hero-history-link"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-brand/20 text-muted font-body text-sm rounded-full hover:border-brand/40 hover:text-charcoal bg-white/60 transition-all duration-200"
                >
                  View Past Analyses
                </Link>
              </div>

              <div className="anim-fade-up anim-delay-450 flex flex-wrap gap-4 pt-1">
                {[
                  { icon: '🔒', text: 'On-device only' },
                  { icon: '⚡', text: 'Under 5 seconds' },
                  { icon: '💄', text: '48 real shades' },
                ].map(({ icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-xs text-muted">
                    <span>{icon}</span>
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — floating swatch ring (on-load) */}
            <div
              className="hidden lg:flex items-center justify-center anim-fade-in anim-delay-550"
              aria-hidden="true"
            >
              <div className="relative w-[400px] h-[400px] anim-float-slow">
                <div className="absolute inset-0 rounded-full border-2 border-brand-light/40" />
                <div className="absolute inset-[60px] rounded-full bg-brand-light/50" />

                {HERO_SWATCHES.map((hex, i) => {
                  const total = HERO_SWATCHES.length;
                  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                  const radius = 155;
                  const cx = 200 + radius * Math.cos(angle);
                  const cy = 200 + radius * Math.sin(angle);
                  const size = i % 3 === 0 ? 54 : i % 3 === 1 ? 46 : 40;
                  return (
                    <div
                      key={`${hex}-${i}`}
                      className="absolute rounded-full border-4 border-white shadow-lg anim-swatch-pop hover:scale-110 transition-transform duration-200 cursor-default"
                      style={{
                        backgroundColor: hex,
                        width: size,
                        height: size,
                        left: cx - size / 2,
                        top: cy - size / 2,
                        animationDelay: `${600 + i * 60}ms`,
                      }}
                    />
                  );
                })}

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-0.5">
                  <p className="font-display text-3xl text-brand leading-none">10</p>
                  <p className="text-xs text-muted leading-tight">skin tones<br />matched</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BRAND BAR ────────────────────────────────────────────────────── */}
        <div className="w-full bg-white border-b border-brand-light overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 lg:px-16 py-5 flex flex-wrap items-center gap-x-12 gap-y-2">
            <Reveal from="fade">
              <p className="text-xs text-muted uppercase tracking-widest">Featured brands</p>
            </Reveal>
            {["MAC", "Maybelline", "L'Oréal", "Rare Beauty"].map((b, i) => (
              <Reveal key={b} from="up" delay={i * 80}>
                <span className="font-display text-xl text-charcoal/30 hover:text-charcoal/70 transition-colors duration-300 cursor-default select-none">
                  {b}
                </span>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section id="how-it-works" aria-labelledby="how-heading" className="w-full bg-cream py-24">
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <Reveal from="left" className="mb-14">
              <p className="text-xs text-muted uppercase tracking-widest mb-3">How it works</p>
              <h2 id="how-heading" className="font-display text-4xl lg:text-5xl text-charcoal">
                Three steps to your<br className="hidden sm:block" /> perfect match
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-9 left-[calc(33.33%-2rem)] right-[calc(33.33%-2rem)] h-px bg-brand-light z-0" aria-hidden="true" />

              {HOW_IT_WORKS.map(({ step, title, description, icon }, idx) => (
                <Reveal key={step} from="up" delay={idx * 120} className="z-10">
                  <div className="card-lift flex flex-col gap-5 bg-white rounded-2xl p-8 border border-brand-light h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110">
                        {icon}
                      </div>
                      <span className="font-display text-5xl text-brand-light font-semibold select-none leading-none">
                        {step}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-charcoal mb-2">{title}</h3>
                      <p className="text-muted text-sm leading-relaxed">{description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── MST SWATCHES ─────────────────────────────────────────────────── */}
        <section id="mst-swatches" aria-labelledby="mst-heading" className="w-full bg-white border-y border-brand-light py-24">
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              <Reveal from="left">
                <div>
                  <p className="text-xs text-muted uppercase tracking-widest mb-3">Inclusive by design</p>
                  <h2 id="mst-heading" className="font-display text-4xl lg:text-5xl text-charcoal mb-5 leading-tight">
                    Every shade,<br />covered
                  </h2>
                  <p className="text-muted text-base leading-relaxed mb-6 max-w-sm">
                    Trained across all 10 tones of the Monk Skin Tone Scale — the most scientifically
                    inclusive skin tone reference available.
                  </p>
                  <Link
                    to="/app"
                    className="link-underline inline-flex items-center gap-2 text-sm text-brand font-medium hover:gap-3 transition-all duration-200"
                  >
                    Find your match
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </Reveal>

              <div className="grid grid-cols-5 gap-3" role="list" aria-label="Monk Skin Tone Scale reference">
                {MST_REFERENCE.map((tone, i) => (
                  <Reveal key={tone.index} from="scale" delay={i * 50}>
                    <div role="listitem" className="group flex flex-col items-center gap-2">
                      <div
                        className="w-full aspect-square rounded-2xl border-2 border-white shadow-md group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 cursor-default"
                        style={{ backgroundColor: tone.hex }}
                        aria-label={`${tone.label}: ${tone.description}`}
                      />
                      <p className="text-[10px] font-semibold text-charcoal/60 tracking-wide text-center">{tone.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────── */}
        <section className="w-full bg-cream py-20" aria-label="Feature highlights">
          <div className="max-w-7xl mx-auto px-8 lg:px-16 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
            {[
              { stat: '48', label: 'Real products',  sub: 'From 4 premium brands' },
              { stat: '10', label: 'Skin tones',      sub: 'Full Monk Scale coverage' },
              { stat: '~3s', label: 'Analysis time',  sub: 'All on your device' },
            ].map(({ stat, label, sub }, i) => (
              <Reveal key={label} from="up" delay={i * 100}>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="font-display text-6xl text-brand leading-none">{stat}</p>
                  <p className="font-display text-xl text-charcoal mt-1">{label}</p>
                  <p className="text-muted text-xs">{sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section className="w-full bg-brand py-24 px-8 text-center relative overflow-hidden" aria-label="Call to action">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 animate-pulse" aria-hidden="true" />
          <div className="absolute -bottom-20 -right-12 w-80 h-80 rounded-full bg-brand-accent/20 animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />

          <Reveal from="up" className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-display text-4xl lg:text-5xl text-white mb-4 leading-tight">
              Ready to find<br />your perfect match?
            </h2>
            <p className="text-white/70 text-sm mb-10 leading-relaxed">
              Upload a photo and get science-backed, personalised shade recommendations in seconds.
            </p>
            <Link
              to="/app"
              id="bottom-cta"
              className="inline-flex items-center gap-2 px-9 py-4 bg-white text-brand font-body text-sm rounded-full hover:bg-cream hover:gap-3 active:scale-[0.97] transition-all duration-200 shadow-md"
            >
              Get Started — It's Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </Reveal>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="w-full bg-cream border-t border-brand-light py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-brand flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-accent" aria-hidden="true" />
            ShadeSense
          </span>
          <p className="text-xs text-muted text-center">
            © {new Date().getFullYear()} ShadeSense · AI-powered shade matching for every skin tone
          </p>
          <Link to="/app" className="link-underline text-xs text-brand">
            Try It Now →
          </Link>
        </div>
      </footer>
    </div>
  );
}
