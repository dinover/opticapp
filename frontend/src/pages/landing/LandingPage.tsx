import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, createAnimatable, createTimeline, stagger, svg, utils } from 'animejs';
import {
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserPlusIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  HomeIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  PlusIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { COPY, type Copy, type Lang } from './i18n';
import {
  AppFrame,
  ClientsFeature,
  ClientsScreen,
  CustomFeature,
  DashboardScreen,
  ImportFeature,
  ReceiptFeature,
  ReportsFeature,
  ReportsScreen,
  RxFeature,
  RxGrid,
  SaleScreen,
  ScaledFrame,
  StockFeature,
  TeamFeature,
  XlsxIcon,
  SALE_TOTAL,
  fmtInt,
  fmtMoney,
  type ScreenProps,
} from './Mockups';
import './landing.css';

/* ═══════════════════════════════════════════════════════════
   Helpers de animación (anime.js v4)
   Regla general: el HTML se renderiza en su estado FINAL (así se ve bien
   sin JS o con "reducir movimiento") y las animaciones parten "desde" un
   estado oculto que se aplica antes del primer paint (useLayoutEffect).
   ═══════════════════════════════════════════════════════════ */

type Revertible = { revert: () => unknown };
type Keep = <T extends Revertible>(anim: T) => T;

const FRAME_WIDTH = 1240;
const TOUR_MS = 7000;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const $$ = (root: ParentNode, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
const $1 = (root: ParentNode, sel: string) => root.querySelector<HTMLElement>(sel)!;
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Contador que sube hasta data-count. Lee el idioma en cada frame por si cambia a mitad de camino. */
function countUp(el: HTMLElement, getLang: () => Lang, duration: number, delay: number) {
  const to = Number(el.dataset.count) || 0;
  const money = el.dataset.kind === 'money';
  const state = { v: 0 };
  const render = () => {
    el.textContent = money ? fmtMoney(state.v, getLang()) : fmtInt(state.v, getLang());
  };
  render();
  return animate(state, { v: to, duration, delay, ease: 'out(4)', onUpdate: render, onComplete: render });
}

/** Los dígitos "se enfocan" de izquierda a derecha, como un autorrefractómetro midiendo. */
function focusDigits(el: HTMLElement, duration: number, delay: number) {
  const final = el.dataset.rx ?? '';
  const state = { p: 0 };
  const render = () => {
    const fixed = Math.floor(state.p * final.length);
    el.textContent = Array.from(final)
      .map((ch, i) => (i < fixed || !/\d/.test(ch) ? ch : String(Math.floor(Math.random() * 10))))
      .join('');
  };
  return animate(state, {
    p: 1,
    duration,
    delay,
    ease: 'linear',
    onUpdate: render,
    onComplete: () => { el.textContent = final; },
  });
}

function typeText(el: HTMLElement, text: string, duration: number, delay: number) {
  const state = { n: 0 };
  el.textContent = '';
  return animate(state, {
    n: text.length,
    duration,
    delay,
    ease: 'linear',
    onUpdate: () => { el.textContent = text.slice(0, Math.round(state.n)); },
  });
}

/** Entrada de una pantalla de la app: filas, contadores, barras y ficha óptica. */
function runScreen(scope: HTMLElement, keep: Keep, getLang: () => Lang) {
  // Cada pantalla tiene sus propios elementos (el dashboard no tiene barras, p. ej.);
  // anime avisa por consola si se le pasa una lista vacía, así que se saltean.
  const grow = (targets: HTMLElement[], from: Record<string, number>, to: Record<string, number>, delay: number) => {
    if (!targets.length) return;
    keep(utils.set(targets, from));
    keep(animate(targets, { ...to, duration: 1200, delay: stagger(80, { start: delay }), ease: 'outExpo' }));
  };
  const rows = $$(scope, '[data-row]');
  keep(utils.set(rows, { opacity: 0, y: 16 }));
  keep(animate(rows, { opacity: 1, y: 0, duration: 800, delay: stagger(40), ease: 'out(3)' }));
  grow($$(scope, '[data-bar]'), { scaleY: 0 }, { scaleY: 1 }, 300);
  grow($$(scope, '[data-hbar]'), { scaleX: 0 }, { scaleX: 1 }, 400);
  $$(scope, '[data-count]').forEach((el, i) => keep(countUp(el, getLang, 1800, 150 + i * 90)));
  $$(scope, '[data-rx]').forEach((el, i) => keep(focusDigits(el, 900, 300 + i * 70)));
}

/**
 * Animaciones del bento. `prepare` deja cada visual en su estado inicial y
 * devuelve la función que lo reproduce cuando la tarjeta entra en pantalla.
 */
type FeaturePrep = (el: HTMLElement, keep: Keep, getLang: () => Lang) => (delay: number) => void;

const FEATURE_ANIMS: Record<string, FeaturePrep> = {
  rx: (el, keep) => {
    const lines = svg.createDrawable($$(el, '.fv-draw'));
    const pop = $$(el, '[data-pop]');
    const cells = $$(el, '[data-rx]');
    keep(utils.set(lines, { draw: '0 0' }));
    keep(utils.set(pop, { opacity: 0, scale: 0.85, y: 6 }));
    return (delay) => {
      keep(animate(lines, { draw: ['0 0', '0 1'], duration: 1600, delay: stagger(140, { start: delay }), ease: 'inOutCubic' }));
      cells.forEach((c, i) => keep(focusDigits(c, 1000, delay + 300 + i * 90)));
      keep(animate(pop, { opacity: 1, scale: 1, y: 0, duration: 800, delay: delay + 1500, ease: 'outBack(1.8)' }));
    };
  },
  clients: (el, keep) => {
    const typed = el.querySelector<HTMLElement>('[data-typed]');
    const items = $$(el, '[data-item]');
    const dims = $$(el, '.is-dim');
    const hits = $$(el, '.is-hit');
    keep(utils.set(items, { opacity: 0, x: -12 }));
    if (typed) typed.textContent = '';
    return (delay) => {
      keep(animate(items, { opacity: 1, x: 0, duration: 700, delay: stagger(70, { start: delay }), ease: 'outExpo' }));
      if (typed) keep(typeText(typed, typed.dataset.typed ?? '', 550, delay + 900));
      keep(animate(dims, { opacity: 0.28, duration: 500, delay: delay + 1550, ease: 'out(2)' }));
      keep(animate(hits, { scale: [1, 1.035, 1], duration: 600, delay: stagger(80, { start: delay + 1550 }), ease: 'inOutSine' }));
    };
  },
  stock: (el, keep, getLang) => {
    const items = $$(el, '[data-item]');
    keep(utils.set(items, { opacity: 0, y: 18 }));
    return (delay) => {
      keep(animate(items, { opacity: 1, y: 0, duration: 900, delay: stagger(120, { start: delay }), ease: 'outBack(1.4)' }));
      $$(el, '[data-count]').forEach((c, i) => keep(countUp(c, getLang, 1200, delay + 250 + i * 120)));
    };
  },
  receipt: (el, keep) => {
    const paper = $1(el, '[data-paper]');
    const slot = $1(el, '.fv-slot');
    keep(utils.set(paper, { y: '-102%' }));
    return (delay) => {
      keep(animate(paper, { y: '0%', duration: 2600, delay, ease: 'inOutSine' }));
      keep(animate(slot, { x: [0, -1.2, 1.2, 0], duration: 160, loop: 14, delay, ease: 'linear' }));
    };
  },
  reports: (el, keep) => {
    const bars = $$(el, '[data-bar]');
    const chip = $1(el, '[data-drop]');
    keep(utils.set(bars, { scaleY: 0 }));
    keep(utils.set(chip, { opacity: 0, y: -46, rotate: -8 }));
    return (delay) => {
      keep(animate(bars, { scaleY: 1, duration: 1200, delay: stagger(60, { start: delay }), ease: 'outExpo' }));
      keep(animate(chip, { opacity: 1, duration: 300, delay: delay + 1000 }));
      keep(animate(chip, { y: 0, rotate: 0, duration: 1300, delay: delay + 1000, ease: 'outElastic(1, .55)' }));
    };
  },
  import: (el, keep, getLang) => {
    const file = $1(el, '[data-file]');
    const bar = $1(el, '[data-progress]');
    const loading = $1(el, '[data-loading]');
    const done = $1(el, '[data-done]');
    const count = $1(el, '[data-count]');
    keep(utils.set(file, { opacity: 0, y: -50, scale: 0.9 }));
    keep(utils.set(bar, { scaleX: 0 }));
    keep(utils.set(loading, { opacity: 1 }));
    keep(utils.set(done, { opacity: 0, y: 8 }));
    return (delay) => {
      keep(animate(file, { opacity: 1, y: 0, scale: 1, duration: 900, delay, ease: 'outBack(1.5)' }));
      keep(animate(bar, { scaleX: 1, duration: 1600, delay: delay + 700, ease: 'inOutQuad' }));
      keep(animate(loading, { opacity: 0, y: -8, duration: 400, delay: delay + 2300 }));
      keep(animate(done, { opacity: 1, y: 0, duration: 600, delay: delay + 2450, ease: 'outExpo' }));
      keep(countUp(count, getLang, 900, delay + 2450));
    };
  },
  team: (el, keep) => {
    const items = $$(el, '[data-item]');
    const add = $1(el, '[data-pulse]');
    keep(utils.set(items, { opacity: 0, x: -24 }));
    keep(utils.set(add, { opacity: 0 }));
    return (delay) => {
      keep(animate(items, { opacity: 1, x: 0, duration: 900, delay: stagger(140, { start: delay }), ease: 'outExpo' }));
      keep(animate(add, { opacity: 1, duration: 600, delay: delay + 650 }));
      keep(animate(add, { scale: [1, 1.035], duration: 900, delay: delay + 1300, loop: true, alternate: true, ease: 'inOutSine' }));
    };
  },
  custom: (el, keep) => {
    const knob = $1(el, '[data-knob]');
    const seg = $1(el, '[data-seg]');
    const a = $1(el, '[data-swap-a]');
    const b = $1(el, '[data-swap-b]');
    return (delay) => {
      const loop = { duration: 600, loop: true, alternate: true, loopDelay: 1600, ease: 'inOutQuart' };
      keep(animate(knob, { x: [0, 22], ...loop, delay }));
      keep(animate(seg, { x: ['0%', '100%'], ...loop, delay: delay + 900 }));
      keep(animate(a, { opacity: [1, 0], y: [0, -10], ...loop, delay: delay + 900 }));
      keep(animate(b, { opacity: [0, 1], y: [10, 0], ...loop, delay: delay + 900 }));
    };
  },
};

// ── Geometría del anillo de 7 días ────────────────────────────
const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};
const arcPath = (r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_ARC = 360 / 7;
const DAY_GAP = 9;

const STEP_PATH = 'M200 40 C 330 0, 470 80, 600 40 S 870 0, 1000 40';
const STEP_ICONS = [UserPlusIcon, ArrowUpTrayIcon, ChartBarIcon];
const TOUR_ICONS = [HomeIcon, UserGroupIcon, ShoppingCartIcon, DocumentChartBarIcon];
const TOUR_NAV = ['dashboard', 'clients', 'sales', 'reports'] as const;
const TOUR_SCREENS: React.FC<ScreenProps>[] = [DashboardScreen, ClientsScreen, SaleScreen, ReportsScreen];

type FeatureKey = keyof Copy['features']['items'];
const BENTO: { key: FeatureKey; wide: boolean; Visual: React.FC<ScreenProps> }[] = [
  { key: 'rx', wide: true, Visual: RxFeature },
  { key: 'clients', wide: false, Visual: ClientsFeature },
  { key: 'stock', wide: false, Visual: StockFeature },
  { key: 'receipt', wide: false, Visual: ReceiptFeature },
  { key: 'reports', wide: true, Visual: ReportsFeature },
  { key: 'import', wide: false, Visual: ImportFeature },
  { key: 'team', wide: true, Visual: TeamFeature },
  { key: 'custom', wide: true, Visual: CustomFeature },
];

type SectionId = 'features' | 'how' | 'tour' | 'trial' | 'faq';

/** Separa en letras (dentro de palabras que no se cortan) para animarlas una por una. */
const SplitChars: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(' ').map((word, wi, words) => (
      <React.Fragment key={wi}>
        <span className="lp-word">
          {Array.from(word).map((ch, ci) => <span key={ci} className="lp-char">{ch}</span>)}
        </span>
        {wi < words.length - 1 && ' '}
      </React.Fragment>
    ))}
  </>
);

const LangSwitch: React.FC<{ lang: Lang; onChange: (l: Lang) => void; label: string }> = ({ lang, onChange, label }) => (
  <div className="lp-lang" data-lang={lang} role="group" aria-label={label}>
    <span className="lp-lang-knob" aria-hidden="true" />
    {(['es', 'en'] as const).map((l) => (
      <button key={l} type="button" className={lang === l ? 'is-on' : ''} aria-pressed={lang === l} onClick={() => onChange(l)}>
        {l.toUpperCase()}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */

const LandingPage: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const t = COPY[lang];
  const langRef = useRef(lang);
  langRef.current = lang;
  const getLang = () => langRef.current;

  const { theme, toggleTheme } = useTheme();
  const [reduced] = useState(prefersReducedMotion);
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const tourScreenRef = useRef<HTMLDivElement>(null);
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const goTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });

  // Título del documento (el atributo lang de <html> lo maneja LanguageProvider)
  useEffect(() => {
    document.title = t.meta.title;
  }, [t.meta.title]);
  useEffect(() => () => {
    document.title = 'OpticApp';
  }, []);

  // Nav con fondo al scrollear
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Coreografía principal ───────────────────────────────────
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const tracked: Revertible[] = [];
    const keep: Keep = (anim) => {
      tracked.push(anim);
      return anim;
    };

    const hero = $1(root, '.lp-hero');
    const stage = $1(hero, '.lp-hero-stage');
    const tiltEl = $1(hero, '.lp-hero-tilt');
    const l2 = $1(hero, '.l2');
    const chars = $$(hero, '.l1 .lp-char');
    const heroParts = $$(hero, '.lp-badge, .lp-hero-sub, .lp-hero-ctas, .lp-hero-note');
    const floats = $$(hero, '.lp-float');
    const floatCards = $$(hero, '.lp-float-card');
    const rings = svg.createDrawable($$(hero, '.lp-rings .draw'));

    // Estado inicial del hero, antes del primer paint
    keep(utils.set(heroParts, { opacity: 0, y: 18 }));
    keep(utils.set(chars, { opacity: 0, y: '100%' }));
    keep(utils.set(l2, { opacity: 0, filter: 'blur(18px)', scale: 1.08 }));
    keep(utils.set(stage, { opacity: 0, y: 90 }));
    keep(utils.set(floatCards, { opacity: 0, scale: 0.8 }));
    keep(utils.set($$(tiltEl, '[data-row]'), { opacity: 0 }));
    keep(utils.set(rings, { draw: '0 0' }));

    // Intro: los anillos de lente se dibujan, el título entra y la frase "en foco" se enfoca
    keep(
      createTimeline({ defaults: { ease: 'outExpo' } })
        .add(rings, { draw: ['0 0', '0 1'], duration: 2400, delay: stagger(120), ease: 'inOutQuart' }, 0)
        .add(heroParts[0], { opacity: 1, y: 0, duration: 900 }, 100)
        .add(chars, { opacity: 1, y: '0%', duration: 1100, delay: stagger(26) }, 200)
        .add(l2, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1700, ease: 'outQuart' }, 600)
        .add(heroParts.slice(1), { opacity: 1, y: 0, duration: 1000, delay: stagger(100) }, 900)
        .add(stage, { opacity: 1, y: 0, duration: 1800 }, 1000)
        .add(floatCards, { opacity: 1, scale: 1, duration: 900, delay: stagger(180), ease: 'outBack(1.6)' }, 1900),
    );
    // Con la ventana ya casi en su lugar, el dashboard "carga" sus datos.
    // (Un setTimeout y no timeline.call(): lo creado dentro de ese callback no llegaba a animarse.)
    const screenTimer = window.setTimeout(() => runScreen(stage, keep, getLang), 1500);

    // Loops ambientales
    $$(hero, '.lp-float-bob').forEach((el, i) =>
      keep(animate(el, { y: [-8, 8], duration: 3000 + i * 600, delay: i * 400, ease: 'inOutSine', loop: true, alternate: true })),
    );
    keep(animate($$(hero, '.lp-rings .spin'), { rotate: 360, duration: 120000, ease: 'linear', loop: true }));
    const ctaLogo = root.querySelector<HTMLElement>('.lp-cta-logo');
    if (ctaLogo) keep(animate(ctaLogo, { y: [-7, 7], rotate: [-3, 3], duration: 3400, ease: 'inOutSine', loop: true, alternate: true }));
    const ctaRings = root.querySelector<HTMLElement>('.lp-cta-rings');
    if (ctaRings) keep(animate(ctaRings, { rotate: -360, duration: 90000, ease: 'linear', loop: true }));
    const marquee = root.querySelector<HTMLElement>('.lp-marquee-track');
    if (marquee) keep(animate(marquee, { x: ['0%', '-50%'], duration: 45000, ease: 'linear', loop: true }));

    // Parallax de las tarjetas flotantes + foco de luz que sigue al mouse
    const movers = floats.map(
      (el) => keep(createAnimatable(el, { x: 900, y: 900, ease: 'out(3)' })) as unknown as {
        x: (v: number) => unknown;
        y: (v: number) => unknown;
      },
    );
    const onPointer = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      hero.style.setProperty('--mx', `${px}px`);
      hero.style.setProperty('--my', `${py}px`);
      const nx = px / r.width - 0.5;
      const ny = py / r.height - 0.5;
      movers.forEach((m, i) => {
        const depth = Number(floats[i].dataset.depth) || 1;
        m.x(nx * 36 * depth);
        m.y(ny * 26 * depth);
      });
    };
    hero.addEventListener('pointermove', onPointer);

    // Animaciones atadas al scroll: la ventana del hero se "endereza" y la línea de pasos se dibuja
    const tilt = keep(animate(tiltEl, { rotateX: [18, 0], scale: [0.94, 1], duration: 1000, ease: 'linear', autoplay: false }));
    const steps = root.querySelector<HTMLElement>('.lp-steps');
    const stepLine = svg.createDrawable($$(root, '.lp-steps-line .draw'));
    const stepAnim = keep(animate(stepLine, { draw: ['0 0', '0 1'], duration: 1000, ease: 'linear', autoplay: false }));
    const syncScroll = () => {
      const vh = window.innerHeight;
      tilt.seek(clamp(window.scrollY / (vh * 0.6)) * 1000);
      if (steps) {
        const r = steps.getBoundingClientRect();
        stepAnim.seek(clamp((vh * 0.85 - r.top) / (vh * 0.55)) * 1000);
      }
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncScroll);
    };
    syncScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Reveals al entrar en pantalla
    const reveals = $$(root, '[data-reveal]');
    keep(utils.set(reveals, { opacity: 0, y: 36 }));
    keep(utils.set($$(root, '[data-reveal="focus"]'), { filter: 'blur(10px)' }));

    const featurePlays = new Map<Element, (delay: number) => void>();
    $$(root, '[data-feature]').forEach((el) => {
      const prep = FEATURE_ANIMS[el.dataset.feature ?? ''];
      if (prep) featurePlays.set(el, prep(el, keep, getLang));
    });

    // Anillo de la prueba gratis: un segmento por día
    let playTrial: (() => void) | null = null;
    const trialEl = root.querySelector<HTMLElement>('[data-trial]');
    if (trialEl) {
      const segs = svg.createDrawable($$(trialEl, '.lp-ring-seg'));
      const labels = $$(trialEl, '.lp-ring-day');
      const num = $1(trialEl, '.lp-ring-num');
      const checks = $$(trialEl, '.lp-checks li');
      keep(utils.set(segs, { draw: '0 0' }));
      keep(utils.set(labels, { opacity: 0 }));
      keep(utils.set(num, { opacity: 0, scale: 0.5 }));
      keep(utils.set(checks, { opacity: 0, x: -16 }));
      playTrial = () => {
        keep(animate(segs, { draw: ['0 0', '0 1'], duration: 520, delay: stagger(160, { start: 250 }), ease: 'inOutQuad' }));
        keep(animate(labels, { opacity: 1, duration: 400, delay: stagger(160, { start: 450 }) }));
        keep(animate(num, { opacity: 1, scale: 1, duration: 1500, delay: 1350, ease: 'outElastic(1, .55)' }));
        keep(animate(checks, { opacity: 1, x: 0, duration: 800, delay: stagger(110, { start: 500 }), ease: 'outExpo' }));
      };
    }

    // Pantalla inicial del recorrido: oculta hasta que se vea
    keep(utils.set($$(root, '.lp-tour-screen [data-row]'), { opacity: 0 }));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          const delay = Number(el.dataset.delay) || 0;
          if (el.dataset.reveal !== undefined) {
            keep(animate(el, { opacity: 1, y: 0, duration: 1100, delay, ease: 'outExpo' }));
            if (el.dataset.reveal === 'focus') keep(animate(el, { filter: 'blur(0px)', duration: 1300, delay, ease: 'outQuart' }));
          }
          featurePlays.get(el)?.(delay + 250);
          if (el.dataset.trial !== undefined) playTrial?.();
          if (el.dataset.tour !== undefined) setTourActive(true);
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    );
    $$(root, '[data-reveal], [data-feature], [data-trial], [data-tour]').forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      window.clearTimeout(screenTimer);
      hero.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      tracked.reverse().forEach((a) => a.revert());
    };
    // La coreografía se arma una sola vez; el idioma se lee vía ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Al cambiar de idioma, el título vuelve a "enfocarse"
  const prevLang = useRef(lang);
  useLayoutEffect(() => {
    if (prevLang.current === lang || reduced) {
      prevLang.current = lang;
      return;
    }
    prevLang.current = lang;
    const root = rootRef.current;
    if (!root) return;
    const chars = $$(root, '.lp-hero .l1 .lp-char');
    const l2 = $1(root, '.lp-hero .l2');
    utils.set(chars, { opacity: 0, y: '100%' });
    const a1 = animate(chars, { opacity: 1, y: '0%', duration: 900, delay: stagger(20), ease: 'outExpo' });
    const a2 = animate(l2, { opacity: [0, 1], filter: ['blur(14px)', 'blur(0px)'], duration: 1200, ease: 'outQuart' });
    return () => {
      a1.complete();
      a2.complete();
    };
  }, [lang, reduced]);

  // Recorrido: entrada de cada pantalla
  useLayoutEffect(() => {
    const el = tourScreenRef.current;
    if (reduced || !tourActive || !el) return;
    const tracked: Revertible[] = [];
    runScreen(el, (a) => { tracked.push(a); return a; }, getLang);
    return () => tracked.forEach((a) => a.revert());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tourActive, reduced]);

  // Recorrido: avance automático con barra de progreso en la pestaña activa
  useEffect(() => {
    const bar = progressRefs.current[tab];
    if (reduced || !tourActive || tourPaused || !bar) return;
    const anim = animate(bar, {
      scaleX: [0, 1],
      duration: TOUR_MS,
      ease: 'linear',
      onComplete: () => setTab((v) => (v + 1) % TOUR_SCREENS.length),
    });
    return () => { anim.revert(); };
  }, [tab, tourActive, tourPaused, reduced]);

  // Brillo que sigue al puntero sobre las tarjetas del bento
  const onBentoMove = (e: React.PointerEvent<HTMLDivElement>) => {
    $$(e.currentTarget, '.lp-feature').forEach((card) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  };

  const navItems: [SectionId, string][] = [
    ['features', t.nav.features],
    ['how', t.nav.how],
    ['tour', t.nav.tour],
    ['trial', t.nav.trial],
    ['faq', t.nav.faq],
  ];
  const TourScreen = TOUR_SCREENS[tab];

  return (
    <div className="lp" ref={rootRef}>
      {/* ── Nav ─────────────────────────────── */}
      <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="lp-wrap lp-nav-inner">
          <button type="button" className="lp-brand" onClick={scrollTop}>
            <img src="/logo.png" alt="" />
            <span>OpticApp</span>
          </button>
          <nav className="lp-links" aria-label={t.nav.menu}>
            {navItems.map(([id, label]) => (
              <button key={id} type="button" onClick={() => goTo(id)}>{label}</button>
            ))}
          </nav>
          <div className="lp-nav-right">
            <LangSwitch lang={lang} onChange={setLang} label={t.nav.lang} />
            <button
              type="button"
              className="lp-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.nav.toLight : t.nav.toDark}
              title={theme === 'dark' ? t.nav.toLight : t.nav.toDark}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-sm lp-hide-sm">{t.nav.login}</Link>
            <Link to="/request-user" className="lp-btn lp-btn-primary lp-btn-sm">{t.nav.signup}</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-bg" aria-hidden="true">
            <div className="lp-hero-grid" />
            <div className="lp-aurora a1" />
            <div className="lp-aurora a2" />
            <div className="lp-spot" />
            <svg className="lp-rings" viewBox="-550 -550 1100 1100">
              <defs>
                <linearGradient id="lpRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c7a6ff" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              {[190, 270, 360, 455, 540].map((r, i) => (
                <circle key={r} className="draw" r={r} fill="none" stroke="url(#lpRingGrad)" strokeOpacity={0.5 - i * 0.08} strokeWidth={1.2} />
              ))}
              <g className="spin">
                <circle r={315} fill="none" stroke="url(#lpRingGrad)" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 14" />
                {[0, 90, 180, 270].map((a) => {
                  const [x, y] = polar(315, a);
                  return <circle key={a} cx={x} cy={y} r={4} fill="#8b5cf6" fillOpacity={0.55} />;
                })}
              </g>
            </svg>
          </div>

          <div className="lp-wrap">
            <div className="lp-hero-copy">
              <button type="button" className="lp-badge" onClick={() => goTo('trial')}>
                <span className="lp-badge-pill">{t.hero.badgePill}</span>
                <span className="lp-dot" />
                {t.hero.badge}
                <ArrowRightIcon />
              </button>
              <h1 className="lp-h1" aria-label={`${t.hero.line1} ${t.hero.line2}`}>
                <span className="lp-line l1" key={lang} aria-hidden="true"><SplitChars text={t.hero.line1} /></span>
                <span className="lp-line l2" aria-hidden="true"><span className="lp-grad-text">{t.hero.line2}</span></span>
              </h1>
              <p className="lp-hero-sub">{t.hero.sub}</p>
              <div className="lp-hero-ctas">
                <Link to="/request-user" className="lp-btn lp-btn-primary lp-btn-lg">
                  {t.hero.ctaPrimary}
                  <ArrowRightIcon className="arrow" />
                </Link>
                <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-lg">{t.hero.ctaSecondary}</Link>
              </div>
              <p className="lp-hero-note"><CheckCircleIcon />{t.hero.note}</p>
            </div>

            <div className="lp-hero-stage">
              <div className="lp-glow" aria-hidden="true" />
              <div className="lp-float f1" data-depth="1.3" aria-hidden="true">
                <div className="lp-float-bob">
                  <div className="lp-float-card lp-fc-rx">
                    <div className="lp-fc-title"><span className="lp-fc-dot" />{t.float.rx}<em>María García</em></div>
                    <RxGrid t={t} compact />
                  </div>
                </div>
              </div>
              <div className="lp-float f2" data-depth="1.8" aria-hidden="true">
                <div className="lp-float-bob">
                  <div className="lp-float-card lp-fc-row">
                    <div className="lp-fc-ok"><CheckIcon /></div>
                    <div className="lp-fc-text">
                      <b>{t.float.sale}</b>
                      <span>María García · {fmtMoney(SALE_TOTAL, lang)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-float f3" data-depth="1" aria-hidden="true">
                <div className="lp-float-bob">
                  <div className="lp-float-card lp-fc-row">
                    <XlsxIcon size={34} />
                    <div className="lp-fc-text">
                      <b>{t.float.report}</b>
                      <span>{t.float.file}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-hero-tilt" aria-hidden="true">
                <ScaledFrame width={FRAME_WIDTH}>
                  <AppFrame t={t} active="dashboard" trial>
                    <DashboardScreen t={t} lang={lang} />
                  </AppFrame>
                </ScaledFrame>
              </div>
            </div>
          </div>

          <div className="lp-marquee" aria-hidden="true">
            <div className="lp-marquee-track">
              {[0, 1].map((k) => (
                <div key={k} className="lp-marquee-group">
                  {t.marquee.map((item) => (
                    <span key={item} className="lp-marquee-item"><SparklesIcon />{item}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Funciones ───────────────────────── */}
        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-head-center">
              <span className="lp-eyebrow" data-reveal="">{t.features.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="focus">
                {t.features.title}
                <br />
                <span className="lp-grad-text">{t.features.titleAccent}</span>
              </h2>
              <p className="lp-lead" data-reveal="">{t.features.sub}</p>
            </div>
            <div className="lp-bento" onPointerMove={onBentoMove}>
              {BENTO.map(({ key, wide, Visual }, i) => (
                <article
                  key={key}
                  className={`lp-feature${wide ? ' span-2' : ''}`}
                  data-reveal=""
                  data-feature={key}
                  data-delay={(i % 3) * 90}
                >
                  <div className="lp-feature-visual" aria-hidden="true"><Visual t={t} lang={lang} /></div>
                  <h3>{t.features.items[key].title}</h3>
                  <p>{t.features.items[key].desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ───────────────────── */}
        <section className="lp-section lp-section-soft" id="how">
          <div className="lp-wrap">
            <div className="lp-head-center">
              <span className="lp-eyebrow" data-reveal="">{t.how.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="focus">{t.how.title}</h2>
              <p className="lp-lead" data-reveal="">{t.how.sub}</p>
            </div>
            <div className="lp-steps">
              <svg className="lp-steps-line" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="lpStepGrad" x1="0" x2="1">
                    <stop offset="0" stopColor="#c7a6ff" />
                    <stop offset=".5" stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <path className="track" d={STEP_PATH} />
                <path className="draw" d={STEP_PATH} stroke="url(#lpStepGrad)" />
              </svg>
              {t.how.steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <div key={i} className="lp-step" data-reveal="" data-delay={i * 150}>
                    <div className="lp-step-num">
                      <Icon />
                      <span className="lp-step-idx">{i + 1}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                    {step.tag && <span className="lp-step-tag"><GiftIcon />{step.tag}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Recorrido ───────────────────────── */}
        <section className="lp-section" id="tour">
          <div className="lp-wrap">
            <div className="lp-head-center">
              <span className="lp-eyebrow" data-reveal="">{t.tour.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="focus">{t.tour.title}</h2>
              <p className="lp-lead" data-reveal="">{t.tour.sub}</p>
            </div>
            <div className="lp-tabs" role="tablist" data-reveal="">
              {t.tour.tabs.map((label, i) => {
                const Icon = TOUR_ICONS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={tab === i}
                    className={`lp-tab${tab === i ? ' is-on' : ''}`}
                    onClick={() => setTab(i)}
                  >
                    <Icon />
                    {label}
                    <span className="lp-tab-progress" ref={(el) => { progressRefs.current[i] = el; }} />
                  </button>
                );
              })}
            </div>
            <div
              className="lp-tour-stage"
              data-reveal=""
              data-tour=""
              onPointerEnter={(e) => e.pointerType === 'mouse' && setTourPaused(true)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setTourPaused(false)}
            >
              <div className="lp-glow" aria-hidden="true" />
              <div className="lp-tour-screen" ref={tourScreenRef} aria-hidden="true">
                <ScaledFrame width={FRAME_WIDTH}>
                  <AppFrame t={t} active={TOUR_NAV[tab]}>
                    <TourScreen key={tab} t={t} lang={lang} />
                  </AppFrame>
                </ScaledFrame>
              </div>
            </div>
          </div>
        </section>

        {/* ── Prueba gratis ───────────────────── */}
        <section className="lp-section" id="trial">
          <div className="lp-wrap">
            <div className="lp-trial" data-reveal="" data-trial="">
              <div className="lp-trial-glow" aria-hidden="true" />
              <div className="lp-ring" aria-hidden="true">
                <svg viewBox="-175 -175 350 350">
                  <defs>
                    <linearGradient id="lpTrialGrad" gradientUnits="userSpaceOnUse" x1="-130" y1="-130" x2="130" y2="130">
                      <stop offset="0" stopColor="#c7a6ff" />
                      <stop offset=".5" stopColor="#8b5cf6" />
                      <stop offset="1" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  {DAYS.map((i) => (
                    <path key={`t${i}`} className="lp-ring-track" d={arcPath(130, i * DAY_ARC + DAY_GAP / 2, (i + 1) * DAY_ARC - DAY_GAP / 2)} />
                  ))}
                  {DAYS.map((i) => (
                    <path key={`s${i}`} className="lp-ring-seg" stroke="url(#lpTrialGrad)" d={arcPath(130, i * DAY_ARC + DAY_GAP / 2, (i + 1) * DAY_ARC - DAY_GAP / 2)} />
                  ))}
                  {DAYS.map((i) => {
                    const [x, y] = polar(160, (i + 0.5) * DAY_ARC);
                    return <text key={`d${i}`} className="lp-ring-day" x={x} y={y}>{i + 1}</text>;
                  })}
                </svg>
                <div className="lp-ring-center">
                  <div>
                    <div className="lp-ring-num lp-grad-text">7</div>
                    <div className="lp-ring-label">{t.trial.days}</div>
                  </div>
                </div>
              </div>
              <div className="lp-trial-copy">
                <span className="lp-eyebrow">{t.trial.eyebrow}</span>
                <h2 className="lp-h2">{t.trial.title}</h2>
                <p className="lp-lead">{t.trial.sub}</p>
                <ul className="lp-checks">
                  {t.trial.bullets.map((b) => (
                    <li key={b}><span className="lp-check"><CheckIcon /></span>{b}</li>
                  ))}
                </ul>
                <Link to="/request-user" className="lp-btn lp-btn-primary lp-btn-lg">
                  {t.trial.cta}
                  <ArrowRightIcon className="arrow" />
                </Link>
                <p className="lp-fine">{t.trial.fine}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preguntas ───────────────────────── */}
        <section className="lp-section" id="faq">
          <div className="lp-wrap">
            <div className="lp-head-center">
              <span className="lp-eyebrow" data-reveal="">{t.faq.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="focus">{t.faq.title}</h2>
            </div>
            <div className="lp-faq">
              {t.faq.items.map((item, i) => {
                const open = faqOpen === i;
                return (
                  <div key={i} className={`lp-faq-item${open ? ' is-open' : ''}`} data-reveal="" data-delay={i * 60}>
                    <button
                      type="button"
                      className="lp-faq-q"
                      aria-expanded={open}
                      aria-controls={`lp-faq-${i}`}
                      onClick={() => setFaqOpen(open ? null : i)}
                    >
                      {item.q}
                      <span className="lp-faq-icon" aria-hidden="true"><PlusIcon /></span>
                    </button>
                    <div className="lp-faq-a" id={`lp-faq-${i}`} role="region">
                      <div><p>{item.a}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA final ───────────────────────── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-cta" data-reveal="">
              <svg className="lp-cta-rings" viewBox="-450 -450 900 900" aria-hidden="true">
                {[130, 210, 290, 370, 440].map((r) => <circle key={r} r={r} />)}
              </svg>
              <img src="/logo.png" alt="" className="lp-cta-logo" />
              <h2 className="lp-h2">{t.cta.title}</h2>
              <p className="lp-lead">{t.cta.sub}</p>
              <div className="lp-hero-ctas">
                <Link to="/request-user" className="lp-btn lp-btn-primary lp-btn-lg">
                  {t.cta.primary}
                  <ArrowRightIcon className="arrow" />
                </Link>
                <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-lg">{t.cta.secondary}</Link>
              </div>
              <p className="lp-cta-note"><CheckCircleIcon />{t.hero.badge}</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <button type="button" className="lp-brand" onClick={scrollTop}>
                <img src="/logo.png" alt="" />
                OpticApp
              </button>
              <p>{t.footer.tagline}</p>
            </div>
            <div className="lp-footer-cols">
              <div className="lp-footer-col">
                <h4>{t.footer.product}</h4>
                {navItems.map(([id, label]) => (
                  <button key={id} type="button" onClick={() => goTo(id)}>{label}</button>
                ))}
              </div>
              <div className="lp-footer-col">
                <h4>{t.footer.account}</h4>
                <Link to="/login">{t.nav.login}</Link>
                <Link to="/request-user">{t.nav.signup}</Link>
              </div>
              <div className="lp-footer-col">
                <h4>{t.nav.lang}</h4>
                <LangSwitch lang={lang} onChange={setLang} label={t.nav.lang} />
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} OpticApp. {t.footer.rights}</span>
            <span>{t.footer.made}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
