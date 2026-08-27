import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid, Crosshair, ShieldCheck, Maximize2, BarChart3, Settings,
  Search, Play, Loader2, ChevronDown, ChevronRight, Check, Copy, X,
  Monitor, Tablet, Smartphone, Download, Layers, Ruler,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Ban, Link2,
  FileCode2, RotateCw, Type, Palette, Box, Image as ImageIcon, Info,
  History, Bell, MousePointer2, Lock, Clock,
  ArrowRight, CircleDashed, HelpCircle, Sparkles, Sun, Moon, Target,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS — two themes, one shape.

   `T` is a live object the whole tree reads during render; `applyTheme` swaps
   its contents in place, so nothing branches on theme and every component is
   written once.

   The signal colours are NOT shared between themes. #0E7C57 reads clearly on
   near-white and collapses to roughly 2:1 on graphite — invisible on an 11px
   monospace label, which is exactly where these colours get used. And the
   surfaces don't simply invert: light is white cards on near-white leaning on
   a soft shadow; dark makes panels *lighter* than the page, because on
   graphite a shadow reads as nothing at all.
   ═══════════════════════════════════════════════════════════════════════════ */
const LIGHT = {
  bg: "#F4F4F5", nav: "#FFFFFF", card: "#FFFFFF",
  ink: "#09090B", ink2: "#52525B", ink3: "#A1A1AA",
  line: "#F0F0F2",
  accent: "#4A3AFF", accentSoft: "#EEECFF",
  pass: "#0E7C57", passBg: "#E7F4EF",
  almost: "#93610B", almostBg: "#FAF1E1",
  fix: "#C0332E", fixBg: "#FAEAE9",
  mute: "#71717A", muteBg: "#F4F4F5",
  /* surfaces beneath the card: sunken panels, track fills, code blocks */
  sunken: "#FAFAFA", sunken2: "#FBFBFC", canvas: "#FAFAFB",
  track: "#EEEEF0", ring: "#EAEAEC", knob: "#E4E4E7", tick: "#D4D4D8",
  onInk: "#FFFFFF", codeBg: "#09090B", codeFg: "#E4E4E7",
  /* box model, borrowed from the DevTools palette */
  bmMargin: "#FBE9D0", bmBorder: "#FBDDC0", bmPadding: "#C7E4D2", bmContent: "#BFD5F5",
  bmMarginFg: "#8A6A2F", bmPaddingFg: "#2C6B48", bmContentFg: "#2A4A7C",
  shadow: "0 1px 2px rgba(9,9,11,.04), 0 10px 30px -18px rgba(9,9,11,.28)",
  shadowLift: "0 1px 2px rgba(9,9,11,.05), 0 18px 44px -22px rgba(9,9,11,.40)",
  hoverRow: "#FAFAFA", hoverSoft: "#EFEFF1", thumb: "#DCDCE0",
};

const DARK = {
  bg: "#0B0B0D", nav: "#141417", card: "#141417",
  ink: "#FAFAFA", ink2: "#A1A1AA", ink3: "#71717A",
  line: "#232327",
  accent: "#8B7DFF", accentSoft: "#221F3D",
  pass: "#3DD9A0", passBg: "#102A22",
  almost: "#E5A93C", almostBg: "#2C2113",
  fix: "#FF7A72", fixBg: "#2E1614",
  mute: "#A1A1AA", muteBg: "#1E1E22",
  sunken: "#18181B", sunken2: "#161619", canvas: "#0F0F11",
  track: "#2A2A30", ring: "#26262B", knob: "#3F3F46", tick: "#52525B",
  onInk: "#09090B", codeBg: "#000000", codeFg: "#E4E4E7",
  bmMargin: "#3A2E18", bmBorder: "#463621", bmPadding: "#173328", bmContent: "#16294A",
  bmMarginFg: "#D8B375", bmPaddingFg: "#6FCFA0", bmContentFg: "#8CB6F0",
  shadow: "0 1px 2px rgba(0,0,0,.5), 0 10px 30px -18px rgba(0,0,0,.8)",
  shadowLift: "0 1px 2px rgba(0,0,0,.6), 0 18px 44px -22px rgba(0,0,0,.9)",
  hoverRow: "#1A1A1E", hoverSoft: "#232327", thumb: "#3F3F46",
};

const T = { ...LIGHT };

const VERDICT = {
  pass: {}, almost: {}, fix: {}, intentional: {}, blocked: {}, unchecked: {},
};

/* Mutates in place rather than returning a new object, so the several hundred
   existing `T.ink` reads need no context plumbing. Called at the top of the
   root component's render, before any child reads a token. */
function applyTheme(name) {
  Object.assign(T, name === "dark" ? DARK : LIGHT);
  Object.assign(VERDICT.pass,        { label: "Pass",        fg: T.pass,   bg: T.passBg,   dot: T.pass });
  Object.assign(VERDICT.almost,      { label: "Almost",      fg: T.almost, bg: T.almostBg, dot: T.almost });
  Object.assign(VERDICT.fix,         { label: "Fix",         fg: T.fix,    bg: T.fixBg,    dot: T.fix });
  Object.assign(VERDICT.intentional, { label: "Intentional", fg: T.mute,   bg: T.muteBg,   dot: T.ink3 });
  Object.assign(VERDICT.blocked,     { label: "Blocked",     fg: T.mute,   bg: T.muteBg,   dot: T.ink3 });
  Object.assign(VERDICT.unchecked,   { label: "Unchecked",   fg: T.mute,   bg: T.muteBg,   dot: T.ink3 });
}
applyTheme("light");

/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════════════════════ */
const NAV = [
  { group: null, items: [{ id: "overview", label: "Overview", icon: LayoutGrid }] },
  { group: "Quality", items: [
    { id: "scan", label: "DQA Scan", icon: Crosshair, badge: 34 },
    { id: "a11y", label: "Accessibility", icon: ShieldCheck, badge: 11 },
  ]},
  { group: "Tools", items: [
    { id: "inspector", label: "Inspector", icon: Maximize2 },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ]},
  { group: null, items: [{ id: "settings", label: "Settings", icon: Settings }] },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — every field traced to a source tool's contract
   Skopos:  Check / Issue / Coverage / RunDelta / CategoryScore / UnmatchedNode
   Phantom: QaIssue / CategoryScore / NodeMapping / PageSectionSummary / A11yReport
   DevLens: DevicePreset / StyleGroup / SyncConfig / FeatureFlagState / RatioPreset
   ═══════════════════════════════════════════════════════════════════════════ */

const VIEWPORTS = [
  { id: "desktop", label: "1440", name: "Desktop", icon: Monitor, w: 1440, h: 900 },
  { id: "tablet",  label: "768",  name: "Tablet",  icon: Tablet, w: 768,  h: 1024 },
  { id: "mobile",  label: "390",  name: "Mobile",  icon: Smartphone, w: 390, h: 844 },
];

/* Phantom QaCategory ×10 + DEFAULT_WEIGHTS */
const CATEGORIES = [
  { id: "layout",          label: "Layout",     icon: Box,       score: 78, checks: 214, open: 9,  weight: 0.20 },
  { id: "typography",      label: "Typography", icon: Type,      score: 71, checks: 168, open: 12, weight: 0.18 },
  { id: "colors",          label: "Colour",     icon: Palette,   score: 93, checks: 142, open: 3,  weight: 0.15 },
  { id: "components",      label: "Components", icon: Layers,    score: 86, checks: 61,  open: 4,  weight: 0.15 },
  { id: "responsive",      label: "Responsive", icon: Maximize2, score: 81, checks: 96,  open: 6,  weight: 0.09 },
  { id: "borders-effects", label: "Borders",    icon: Ruler,     score: 96, checks: 74,  open: 2,  weight: 0.08 },
  { id: "assets",          label: "Assets",     icon: ImageIcon, score: null, checks: 0, open: 0,  weight: 0.07 },
  /* Skopos invariants — computed from rectangles and scroll metrics, so they
     need no Figma counterpart. Every CSS property can be correct while the
     component is visibly broken; property comparison is blind to all of it. */
  { id: "invariants",      label: "Invariants", icon: AlertCircle, score: 74, checks: 88, open: 5, weight: 0.10, noDesign: true },
  { id: "behavior",        label: "Behaviour",  icon: Play,      score: 88, checks: 52,  open: 3,  weight: 0.03 },
  { id: "content",         label: "Content",    icon: FileCode2, score: 91, checks: 45,  open: 2,  weight: 0.03 },
  { id: "tokens",          label: "Tokens",     icon: Link2,     score: 64, checks: 38,  open: 8,  weight: 0.02 },
];

const FINDINGS = [
  {
    id: "f-01", rect: { x: 8,  y: 13, w: 52, h: 6 }, verdict: "fix", category: "typography", section: "Hero",
    layer: "Hero / Headline", selector: ".hero h1", property: "letter-spacing",
    expected: "-1.12px", actual: "0px", delta: 1.12, unit: "px", closeBand: 0.3, fixBand: 0.75,
    confidence: 96, strategy: "text-match",
    evidence: 'Text match: "Ship design, not approximations"',
    why: "Tight display tracking is the whole character of the type ramp. At 0 the headline runs 6px wider per line and wraps differently at 1440.",
    fix: "letter-spacing: -1.12px;",
    source: { file: "styles/hero.css", line: 42, selector: ".hero h1", important: false, authored: "normal" },
    textSample: "Ship design, not approximations",
    viewports: ["desktop", "tablet", "mobile"],
  },
  {
    id: "f-02", rect: { x: 8,  y: 22, w: 16, h: 4 }, verdict: "fix", category: "tokens", section: "Hero",
    layer: "Hero / Primary CTA", selector: ".hero .btn-primary", property: "background-color",
    expected: "var(--brand-600) · #4A3AFF", actual: "#4C3EF7", delta: 2.6, unit: "ΔE", closeBand: 2, fixBand: 8,
    confidence: 94, strategy: "layer-name", tokenRef: "brand/600",
    evidence: "Layer name → class match; Figma variable brand/600 bound to fill",
    why: "Hard-coded rather than reading the token. Visually near-identical today; it drifts the next time the token moves.",
    fix: "background-color: var(--brand-600);",
    source: { file: "styles/buttons.css", line: 18, selector: ".btn-primary", important: false, authored: "#4C3EF7" },
    viewports: ["desktop", "tablet", "mobile"],
  },
  {
    id: "f-03", rect: { x: 8,  y: 12, w: 54, h: 15 }, verdict: "almost", category: "layout", section: "Hero",
    layer: "Hero / Content stack", selector: ".hero__stack", property: "gap",
    expected: "24px", actual: "26px", delta: 2, unit: "px", closeBand: 2, fixBand: 6,
    confidence: 91, strategy: "structural",
    evidence: "Auto-layout parent, same child count and order",
    why: "Inside the close band. Shown so it is visible, not deducted from the score.",
    fix: "gap: 24px;",
    source: { file: "styles/hero.css", line: 61, selector: ".hero__stack", important: false, authored: "26px" },
    viewports: ["desktop"],
  },
  {
    id: "f-04", rect: { x: 6,  y: 38, w: 26, h: 14 }, verdict: "fix", category: "layout", section: "Feature grid",
    layer: "Features / Card", selector: ".features .card", property: "padding-left",
    expected: "32px", actual: "24px", delta: -8, unit: "px", closeBand: 2, fixBand: 6,
    confidence: 88, strategy: "semantic",
    evidence: "Repeated instance, 3 of 3 matched by position and role",
    why: "Applies to all three cards. The inner text block starts 8px early against a 32px design gutter.",
    fix: "padding-left: 32px;",
    source: { file: "styles/features.css", line: 27, selector: ".card", important: true, authored: "24px !important" },
    viewports: ["desktop", "tablet"],
  },
  {
    id: "f-05", rect: { x: 36, y: 38, w: 26, h: 14 }, verdict: "fix", category: "typography", section: "Feature grid",
    layer: "Features / Card title", selector: ".features .card h3", property: "font-weight",
    expected: "600", actual: "500", delta: -1, unit: "wt", closeBand: 0, fixBand: 2,
    confidence: 97, strategy: "explicit-name",
    evidence: "Figma text style Heading/S declares Semi Bold 600",
    why: "One weight step down flattens the hierarchy between card title and card body.",
    fix: "font-weight: 600;",
    source: { file: "styles/features.css", line: 44, selector: ".card h3", important: false, authored: "500" },
    textSample: "Deterministic arithmetic",
    viewports: ["desktop", "tablet", "mobile"],
  },
  {
    id: "f-06", rect: { x: 66, y: 38, w: 26, h: 14 }, verdict: "intentional", category: "components", section: "Feature grid",
    layer: "Features / Icon chip", selector: ".features .chip", property: "height",
    expected: "40px", actual: "44px", delta: 4, unit: "px", closeBand: 1, fixBand: 3,
    confidence: 89, strategy: "spatial",
    evidence: "Geometry overlap 0.94, same role",
    why: "Accepted by Marta Ilagan — raised to 44px to meet WCAG 2.5.8 target size. The design premise is unchanged since acceptance.",
    fix: "height: 40px;",
    source: { file: "styles/features.css", line: 88, selector: ".chip", important: false, authored: "44px" },
    accepted: { author: "Marta Ilagan", reason: "44px tap target — WCAG 2.5.8", state: "active", at: "12 Aug", premise: "40px" },
    viewports: ["desktop", "tablet", "mobile"],
  },
  {
    id: "f-07", rect: { x: 6,  y: 3,  w: 20, h: 4 }, verdict: "unchecked", category: "colors", section: "Pricing",
    layer: "Pricing / Plan card", selector: null, property: "box-shadow",
    expected: "0 8px 24px rgba(9,9,11,.08)", actual: null, delta: null, unit: null,
    confidence: 41, strategy: "unmapped",
    evidence: "No candidate above threshold. Nearest: .plan-wrapper at 41",
    why: "The layer never reached the build, or the matcher could not find it. Reported as unverified rather than as a pass.",
    fix: null, source: null,
    viewports: ["desktop"],
  },
  {
    id: "f-08", rect: { x: 74, y: 3,  w: 20, h: 4 }, verdict: "fix", category: "responsive", section: "Feature grid",
    layer: "Features / Card row", selector: ".features__row", property: "overflow-x",
    expected: "No horizontal overflow at 390px", actual: "documentScrollWidth 412px vs viewport 390px",
    delta: 22, unit: "px", closeBand: 0, fixBand: 8,
    confidence: 100, strategy: "measured",
    evidence: "Measured in-page at the 390 viewport, not inferred from the 1440 layout",
    why: "22px of horizontal scroll on mobile. The fixed 340px card min-width survives the breakpoint.",
    fix: "@media (max-width: 480px) {\n  .features__row .card { min-width: 0; }\n}",
    source: { file: "styles/features.css", line: 12, selector: ".card", important: false, authored: "340px" },
    viewports: ["mobile"],
  },
  {
    id: "f-09", rect: { x: 20, y: 62, w: 24, h: 22 }, verdict: "fix", category: "behavior", section: "Nav",
    layer: "Nav / Link", selector: "header nav a", property: "hover-state",
    expected: "Design defines a hover fill: #F4F4F5", actual: "No computed delta on hover",
    delta: null, unit: null,
    confidence: 87, strategy: "state-probe",
    evidence: "Probed at rest and on hover across 8 nav links — identical computed styles",
    why: "The design defines a hover state the build never produces. Presence is checkable; whether it matches the Figma hover variant is not, and is not asserted.",
    fix: "header nav a:hover { background-color: #F4F4F5; }",
    source: null,
    viewports: ["desktop"],
  },
  {
    id: "f-10", rect: { x: 48, y: 62, w: 24, h: 22 }, verdict: "almost", category: "responsive", section: "Pricing",
    layer: "Pricing / Plan card", selector: ".plan", property: "text-clipping",
    expected: "No clipped text", actual: "scrollHeight 214px vs clientHeight 208px",
    delta: 6, unit: "px", closeBand: 8, fixBand: 24,
    confidence: 93, strategy: "measured",
    evidence: "Measured at the 768 viewport with the real font loaded",
    why: "6px of the plan description is cut at tablet. Inside the close band, but it is real text a visitor cannot read.",
    fix: "min-height: 214px;",
    source: { file: "styles/pricing.css", line: 55, selector: ".plan", important: false, authored: "208px" },
    viewports: ["tablet"],
  },
  /* Invariants — no `expected` from Figma, because the design has no opinion.
     These are true or false on the rendered page alone. */
  {
    id: "f-11", rect: { x: 48, y: 63, w: 12, h: 5  }, verdict: "fix", category: "invariants", section: "Pricing",
    layer: null, selector: ".plan__badge / .plan__price", property: "sibling-overlap",
    expected: "No overlap between siblings", actual: "Overlapping by 4px on both axes",
    delta: null, unit: null, closeBand: null, fixBand: null,
    confidence: 100, strategy: "invariant",
    evidence: "Rect intersection at 768. SVG internals and absolutely-positioned elements are excluded — overlapping shapes are how icons are drawn.",
    why: "Every CSS property on both elements matches the design. Property comparison is structurally blind to this; the rectangle is not.",
    fix: null,
    source: null,
    viewports: ["tablet"],
  },
  {
    id: "f-12", rect: { x: 4,  y: 38, w: 92, h: 15 }, verdict: "fix", category: "invariants", section: "Feature grid",
    layer: null, selector: "body", property: "viewport-overflow",
    expected: "documentScrollWidth ≤ viewport width", actual: "412px viewport, 447px document",
    delta: null, unit: null, closeBand: null, fixBand: null,
    confidence: 100, strategy: "invariant",
    evidence: "Measured on the document, not on element geometry — the same basis WCAG 1.4.10 reflow uses.",
    why: "Horizontal scroll at mobile. This is the coverage a pixel diff used to provide, recovered without screenshots.",
    fix: null,
    source: null,
    viewports: ["mobile"],
  },
];

const SECTION_ORDER = ["Nav", "Hero", "Feature grid", "Pricing"];
const CLEAN_SECTIONS = ["Footer", "Testimonials"];

/* Skopos UnmatchedNode.reason */
const UNMATCHED = [
  { id: "214:88", name: "Pricing / Plan card", source: "figma", role: "container", reason: "below-threshold", nearest: { name: ".plan-wrapper", confidence: 41 }, text: null },
  { id: "214:91", name: "Frame 427", source: "figma", role: "container", reason: "no-candidate", nearest: null, text: null },
  { id: "214:96", name: "Badge / Popular", source: "figma", role: "text", reason: "claimed-by-another", nearest: { name: ".plan__badge", confidence: 78 }, text: "Most popular" },
  { id: "dom-41", name: "div.cookie-banner", source: "dom", role: "container", reason: "no-candidate", nearest: null, text: "We use cookies" },
];

/* Phantom A11yReport — three buckets, WCAG mapping, published scoring */
const A11Y_VIOLATIONS = [
  { id: "color-contrast", wcag: "1.4.3 AA", impact: "serious", count: 4, element: ".hero .btn-ghost",
    what: "Contrast 3.1:1 — #8E8E93 on #FFFFFF", need: "4.5:1 minimum",
    fix: "color: #52525B;", source: "axe-core",
    note: "The design specifies #52525B here, so the build is both inaccessible and off-spec." },
  { id: "phantom-focus-indicator", wcag: "2.4.7 AA", impact: "serious", count: 3, element: "header .menu-toggle",
    what: "outline: none with no replacement — zero computed delta on :focus-visible", need: "A visible focus indicator",
    fix: "outline: 2px solid var(--brand-600);\noutline-offset: 2px;", source: "state probe",
    note: "A failure regardless of what the design says. Keyboard users lose their position entirely." },
  { id: "phantom-design-intent-semantic", wcag: "4.1.2 A", impact: "critical", count: 2, element: ".features .card > div",
    what: "Design marks this layer interactive; build renders <div>, not focusable", need: "An interactive control → <button>",
    fix: null, source: "design intent",
    note: "axe alone cannot catch this — it sees a div with no obligation. Only the design says it was meant to be a control. Silent below 70% mapping confidence." },
  { id: "phantom-target-size", wcag: "2.5.8 AA", impact: "moderate", count: 2, element: ".footer a.social",
    what: "22×22 CSS px, no spacing exception applies", need: "24×24 minimum",
    fix: "min-width: 24px;\nmin-height: 24px;", source: "DOM check",
    note: "The 2.5.8 spacing and user-agent exceptions are implemented — this element qualifies for neither." },
];

const A11Y_REVIEW = [
  { id: "aria-valid-attr-value", wcag: "4.1.2 A", element: ".pricing .toggle",
    what: 'aria-controls="plans-panel" — target not in DOM at load',
    why: "The panel renders on interaction, so the reference may resolve at runtime. The rule ran and could not decide." },
  { id: "phantom-keyboard-order", wcag: "2.4.3 A", element: "nav.primary",
    what: "Tab reached 33 of 67 focusable elements before the press limit",
    why: "Nothing past that point was measured. Not a failure — an unfinished measurement." },
  { id: "phantom-link-text", wcag: "2.4.4 A", element: "a.card-link ×3",
    what: 'Three links reading "Learn more" with different destinations',
    why: "Repeated link text is flagged; whether each wording describes its destination is a judgement about content." },
];

const A11Y_NOT_CHECKED = [
  { area: "Whether a focus indicator is adequate", reason: "not-automatable",
    why: "Whether an element changes on focus is probed. Whether the change is sufficient — contrast against surroundings, size, or whether a sticky header covers it — is not." },
  { area: "Whether alt text is accurate", reason: "not-automatable",
    why: "Obvious filenames and placeholders are flagged for review. Whether a sensible-looking description matches the image is not checkable." },
  { area: "Whether a heading level is semantically right", reason: "not-automatable",
    why: "Only whether the sequence is valid. A correctly-ordered outline can still describe the page wrongly." },
  { area: "Motion, timing, audio and video", reason: "not-built",
    why: "No captions, autoplay or flash-threshold checks ran on this scan." },
  { area: "Reading order correctness", reason: "not-automatable",
    why: "The screen reader view shows the order; it does not judge whether it is the right one." },
  { area: "Pages behind a login", reason: "out-of-scope",
    why: "Authenticated scanning is not supported." },
  { area: "More than one page", reason: "out-of-scope",
    why: "One URL per audit. Site-wide crawling is not supported." },
];

const READING_ORDER = [
  { role: "banner", text: "Skip to content", level: null },
  { role: "heading", text: "Ship design, not approximations", level: 1 },
  { role: "paragraph", text: "Every measurable comparison is deterministic…", level: null },
  { role: "button", text: "Start a scan", level: null },
  { role: "link", text: "Learn more", level: null, warn: "Repeated text, different destination" },
  { role: "heading", text: "What gets compared", level: 3, warn: "Skips h2" },
];

/* DevLens DEVICE_PRESETS — 3 engines × 3 form factors */
const DEVICES = [
  { id: "chrome-desktop-16x9", label: "Chrome Desktop", engine: "chromium", form: "desktop", w: 1920, h: 1080, dpr: 1, mobile: false },
  { id: "chrome-desktop-16x10", label: "Chrome Laptop", engine: "chromium", form: "desktop", w: 1440, h: 900, dpr: 1, mobile: false },
  { id: "chrome-tablet", label: "Pixel Tablet", engine: "chromium", form: "tablet", w: 1024, h: 768, dpr: 2, mobile: true },
  { id: "chrome-mobile", label: "Pixel 8", engine: "chromium", form: "mobile", w: 412, h: 915, dpr: 2.6, mobile: true },
  { id: "webkit-desktop", label: "MacBook Pro", engine: "webkit", form: "desktop", w: 1512, h: 982, dpr: 2, mobile: false },
  { id: "webkit-tablet", label: 'iPad Pro 11"', engine: "webkit", form: "tablet", w: 834, h: 1194, dpr: 2, mobile: true },
  { id: "webkit-mobile", label: "iPhone 15 Pro", engine: "webkit", form: "mobile", w: 393, h: 852, dpr: 3, mobile: true },
  { id: "gecko-desktop", label: "Firefox Desktop", engine: "gecko", form: "desktop", w: 1920, h: 1080, dpr: 1, mobile: false },
  { id: "gecko-mobile", label: "Firefox Mobile", engine: "gecko", form: "mobile", w: 412, h: 915, dpr: 2.6, mobile: true },
];

const RATIOS = ["Free", "1:1", "4:3", "3:2", "16:10", "16:9", "19.5:9", "20:9"];

/* DevLens StyleGroup — `authored` is true when the value differs from the UA default */
const STYLE_GROUPS = [
  { name: "layout", label: "Layout", decls: [
    { p: "display", v: "flex", authored: true },
    { p: "flex-direction", v: "column", authored: true },
    { p: "align-items", v: "flex-start", authored: true },
    { p: "position", v: "static", authored: false },
  ]},
  { name: "spacing", label: "Spacing", decls: [
    { p: "padding", v: "24px 24px 24px 24px", authored: true },
    { p: "gap", v: "26px", authored: true },
    { p: "margin", v: "0px", authored: false },
  ]},
  { name: "typography", label: "Typography", decls: [
    { p: "font-family", v: "Inter, sans-serif", authored: true },
    { p: "font-size", v: "52px", authored: true },
    { p: "font-weight", v: "700", authored: true },
    { p: "letter-spacing", v: "normal", authored: false },
  ]},
  { name: "colors", label: "Colours", decls: [
    { p: "color", v: "rgb(9, 9, 11)", authored: true },
    { p: "background-color", v: "rgba(0, 0, 0, 0)", authored: false },
  ]},
  { name: "effects", label: "Effects", decls: [
    { p: "box-shadow", v: "none", authored: false },
    { p: "opacity", v: "1", authored: false },
  ]},
];

const FEATURE_FLAGS = [
  { id: "noHas", label: "Disable :has()", sub: "Selector-level parent matching" },
  { id: "noContainerQueries", label: "Disable container queries", sub: "@container falls back to the base rule" },
  { id: "noSubgrid", label: "Disable subgrid", sub: "grid-template: subgrid → none" },
  { id: "noBackdropFilter", label: "Disable backdrop-filter", sub: "Frosted surfaces render opaque" },
  { id: "noAspectRatio", label: "Disable aspect-ratio", sub: "Falls back to intrinsic sizing" },
  { id: "nativeScrollbars", label: "Native scrollbars", sub: "Restores the OS gutter width" },
];

const SHORTCUTS = [
  ["⌘I / Ctrl+I", "Toggle inspect mode"],
  ["⌘⇧R / Ctrl+⇧R", "Rotate every viewport"],
  ["Click", "Freeze the hovered element"],
  ["Esc", "Release the frozen element"],
  ["↑ / ↓", "Move to parent / first child"],
  ["← / →", "Previous / next sibling"],
  ["Shift + drag", "Snap resizing to 10px steps"],
];

/* Skopos history store — a target is devUrl + figma node + breakpoint */
const RUNS = [
  { n: 14, at: "18 min ago", score: 84, a11y: 71, coverage: 88, fixed: 9, introduced: 2, duration: 41.2, figma: "disk", quota: 0 },
  { n: 13, at: "2 hours ago", score: 78, a11y: 74, coverage: 86, fixed: 4, introduced: 6, duration: 39.8, figma: "memory", quota: 0 },
  { n: 12, at: "Yesterday", score: 74, a11y: 74, coverage: 81, fixed: 11, introduced: 3, duration: 44.1, figma: "network", quota: 2 },
  { n: 11, at: "Yesterday", score: 69, a11y: 70, coverage: 79, fixed: 2, introduced: 8, duration: 43.0, figma: "disk", quota: 0 },
  { n: 10, at: "2 days ago", score: 72, a11y: 68, coverage: 77, fixed: 6, introduced: 1, duration: 40.5, figma: "network", quota: 2 },
  { n: 9,  at: "3 days ago", score: 66, a11y: 68, coverage: 74, fixed: 3, introduced: 5, duration: 46.3, figma: "disk", quota: 0 },
];

const TARGETS = [
  { name: "Pricing · Plan cards", url: "staging.acme.com/pricing", node: "214-1180", scope: "section.pricing", score: 84, runs: 14, state: "reliable" },
  { name: "Marketing · Home hero", url: "staging.acme.com", node: "108-42", scope: "main > .hero", score: 91, runs: 22, state: "reliable" },
  { name: "App · Settings panel", url: "localhost:3000/settings", node: "331-9", scope: null, score: 62, runs: 5, state: "partial" },
];

const PIPELINE = [
  "Validating target URL",
  "Fetching Figma frame",
  "Launching Chromium · 1440 / 768 / 390",
  "Collecting DOM, computed CSS, accessible names",
  "Running axe-core in page",
  "Driving Tab for keyboard capture",
  "Probing hover and focus states",
  "Mapping layers to elements",
  "Comparing, scoring, persisting",
];

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Layout adapts on measured width, not on breakpoint classes — the artifact
 *  preview pane is often narrower than the browser window, and a `hidden lg:`
 *  sidebar vanishes there and takes the navigation with it. */
function useWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1440 : window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

function Card({ children, className = "", style, lift }) {  return (
    <div className={`dk-surface ${className}`} style={{ borderRadius: 18, boxShadow: lift ? T.shadowLift : T.shadow, ...style }}>
      {children}
    </div>
  );
}

function Pill({ children, fg = T.mute, bg = T.muteBg, className = "", title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 px-2 py-0.5 font-medium whitespace-nowrap ${className}`}
      style={{ borderRadius: 999, color: fg, backgroundColor: bg, fontSize: 11.5, lineHeight: "18px" }}>
      {children}
    </span>
  );
}

function VerdictPill({ verdict }) {
  const v = VERDICT[verdict];
  return <Pill fg={v.fg} bg={v.bg}><span style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: v.dot }} />{v.label}</Pill>;
}

function Label({ children, className = "", color = T.ink3 }) {
  return <div className={`font-medium uppercase ${className}`} style={{ fontSize: 10.5, letterSpacing: "0.09em", color }}>{children}</div>;
}

function SectionTitle({ children, sub, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em", color: T.ink }}>{children}</h2>
        {sub && <p className="mt-0.5" style={{ fontSize: 12.5, color: T.ink2 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function ScoreRing({ value, size = 54, tone = T.ink, segments = 28 }) {
  const stroke = 3.5, r = (size - stroke) / 2, c = size / 2;
  const filled = value == null ? 0 : Math.round((value / 100) * segments);
  const gap = 3.6, step = 360 / segments, arcs = [];
  for (let i = 0; i < segments; i++) {
    const a0 = (-90 + i * step + gap / 2) * (Math.PI / 180);
    const a1 = (-90 + (i + 1) * step - gap / 2) * (Math.PI / 180);
    arcs.push(<path key={i} fill="none" strokeLinecap="round" strokeWidth={stroke}
      stroke={i < filled ? tone : T.ring}
      d={`M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`} />);
  }
  return <svg width={size} height={size} style={{ display: "block" }}>{arcs}</svg>;
}

/* Skopos's signature component — the one thing that makes a threshold legible */
function ToleranceRuler({ delta, unit, closeBand, fixBand }) {
  if (delta == null || closeBand == null) return null;
  const max = Math.max(Math.abs(delta) * 1.35, (fixBand || 1) * 1.6);
  const pct = (v) => 50 + (v / max) * 50;
  const cl = pct(-closeBand), cr = pct(closeBand);
  const fl = pct(-(fixBand || closeBand * 2)), fr = pct(fixBand || closeBand * 2);
  const at = Math.min(97, Math.max(3, pct(delta)));
  const inPass = Math.abs(delta) <= closeBand;
  const inClose = !inPass && Math.abs(delta) <= (fixBand || Infinity);
  const tone = inPass ? T.pass : inClose ? T.almost : T.fix;
  return (
    <div>
      <div className="relative w-full" style={{ height: 26 }}>
        <div className="absolute left-0 right-0" style={{ top: 9, height: 6, borderRadius: 999, backgroundColor: T.fixBg }} />
        <div className="absolute" style={{ top: 9, height: 6, left: `${fl}%`, width: `${fr - fl}%`, backgroundColor: T.almostBg }} />
        <div className="absolute" style={{ top: 9, height: 6, left: `${cl}%`, width: `${cr - cl}%`, borderRadius: 999, backgroundColor: T.passBg }} />
        <div className="absolute" style={{ top: 6, left: "50%", width: 1.5, height: 12, backgroundColor: T.tick, transform: "translateX(-50%)" }} />
        <div className="absolute flex items-center justify-center"
          style={{ top: 4, left: `${at}%`, transform: "translateX(-50%)", width: 16, height: 16, borderRadius: 999, backgroundColor: T.onInk, boxShadow: "0 1px 4px rgba(9,9,11,.28)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: tone }} />
        </div>
      </div>
      <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: T.ink3 }}>
        <span>on spec</span>
        <span style={{ color: tone, fontWeight: 600 }}>
          {delta > 0 ? "+" : ""}{delta}{unit === "px" ? "px" : unit === "ΔE" ? " ΔE" : unit === "wt" ? " step" : ""}
        </span>
        <span>tolerance ±{closeBand}{unit === "px" ? "px" : ""}</span>
      </div>
    </div>
  );
}

function CopyButton({ label = "Copy fix" }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { setDone(true); setTimeout(() => setDone(false), 1400); }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors"
      style={{ borderRadius: 999, fontSize: 12, backgroundColor: done ? T.passBg : T.muteBg, color: done ? T.pass : T.ink }}>
      {done ? <Check size={13} /> : <Copy size={13} />}{done ? "Copied" : label}
    </button>
  );
}

function Toggle({ on, onChange, label, sub }) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 py-2 text-left">
      <span className="min-w-0">
        <span className="block" style={{ fontSize: 12.5, color: T.ink, fontWeight: 500 }}>{label}</span>
        {sub && <span className="block" style={{ fontSize: 11, color: T.ink3 }}>{sub}</span>}
      </span>
      <span className="shrink-0 flex items-center transition-colors"
        style={{ width: 34, height: 20, borderRadius: 999, backgroundColor: on ? T.ink : T.knob, padding: 2 }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: T.onInk, transform: on ? "translateX(14px)" : "none", transition: "transform .18s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
      </span>
    </button>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, mono, type = "text" }) {
  return (
    <div className="flex items-center gap-2 px-3" style={{ height: 38, borderRadius: 12, backgroundColor: T.muteBg }}>
      {Icon && <Icon size={14} color={T.ink3} className="shrink-0" />}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent outline-none"
        style={{ fontSize: 12.5, color: T.ink, fontFamily: mono ? "ui-monospace, monospace" : "inherit" }} />
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span style={{ fontSize: 12.5, color: T.ink2 }}>{k}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{v}</span>
    </div>
  );
}

function ScoreModule({ title, value, suffix = "", delta, sub, tone, footer }) {
  const up = delta != null && delta > 0;
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <Label className="truncate">{title}</Label>
          <div className="flex items-baseline gap-1 mt-2">
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.035em", color: T.ink, fontVariantNumeric: "tabular-nums" }}>
              {value == null ? "—" : value}
            </span>
            {suffix && <span style={{ fontSize: 14, fontWeight: 600, color: T.ink3 }}>{suffix}</span>}
          </div>
          {delta != null && (
            <div className="flex items-center gap-1 mt-1">
              {up ? <ArrowUpRight size={12} color={T.pass} /> : <ArrowDownRight size={12} color={T.fix} />}
              <span style={{ fontSize: 11.5, fontWeight: 600, color: up ? T.pass : T.fix }}>{up ? "+" : ""}{delta}</span>
              <span className="truncate" style={{ fontSize: 11.5, color: T.ink3 }}>vs #13</span>
            </div>
          )}
          {sub && <div className="mt-1.5" style={{ fontSize: 11.5, color: T.ink2, lineHeight: 1.45 }}>{sub}</div>}
        </div>
        <ScoreRing value={value} tone={tone} size={46} />
      </div>
      {footer && (
        <div className="mt-3 pt-3 flex items-start gap-1.5" style={{ borderTop: `1px solid ${T.line}`, fontSize: 11, color: T.ink2, lineHeight: 1.45 }}>
          {footer}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — OVERVIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ go }) {
  const todo = [
    { icon: AlertCircle, tone: T.fix, bg: T.fixBg, title: "2 new WCAG AA failures since run #13",
      sub: "Focus indicator removed on the nav toggle, contrast dropped on the ghost button.", when: "18 min ago", to: "a11y" },
    { icon: CircleDashed, tone: T.almost, bg: T.almostBg, title: "7 mappings need manual review",
      sub: "Confidence 60–74. Geometry-only matches are capped into that band on purpose.", when: "18 min ago", to: "scan" },
    { icon: Clock, tone: T.almost, bg: T.almostBg, title: "1 accepted deviation has gone stale",
      sub: "The design premise changed — Hero / CTA radius was 8px when it was accepted, now 12px.", when: "Yesterday", to: "settings" },
    { icon: Info, tone: T.mute, bg: T.muteBg, title: "19 design layers never reached the build",
      sub: "12 are positioning wrappers that paint nothing; 7 paint and are worth checking.", when: "18 min ago", to: "scan" },
  ];

  return (
    <div className="space-y-6">
      {/* Three questions, three answers — never averaged into one number.
          Grid from 560px up so they read as a set rather than a stack. */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <ScoreModule title="Design fidelity" value={84} delta={6} tone={T.ink} sub="712 checks · 34 open"
          footer={<><CheckCircle2 size={12} color={T.pass} className="shrink-0 mt-px" /> 9 findings closed since run #13</>} />
        <ScoreModule title="Accessibility" value={71} delta={-3} tone={T.fix} sub="11 violations · 3 need review"
          footer={<><AlertCircle size={12} color={T.fix} className="shrink-0 mt-px" /> 2 new AA failures</>} />
        <ScoreModule title="Coverage" value={88} suffix="%" tone={T.accent} sub="142 of 161 layers mapped"
          footer={<><Info size={12} color={T.ink3} className="shrink-0 mt-px" /> Mapping verdict: reliable</>} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <Card className="overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em" }}>Needs your attention</h2>
              <Pill>{todo.length}</Pill>
            </div>
            {todo.map((t, i) => {
              const Icon = t.icon;
              return (
                <button key={i} onClick={() => go(t.to)}
                  className="w-full text-left px-5 py-3.5 flex items-start gap-3.5 dk-hover transition-colors"
                  style={{ borderTop: `1px solid ${T.line}` }}>
                  <span className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: t.bg }}>
                    <Icon size={15} color={t.tone} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block" style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{t.title}</span>
                    <span className="block mt-0.5" style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>{t.sub}</span>
                  </span>
                  <span className="shrink-0" style={{ fontSize: 12, color: T.ink3 }}>{t.when}</span>
                </button>
              );
            })}
          </Card>

          {/* Skopos RunDelta */}
          <Card className="p-5">
            <SectionTitle sub="Against the last scan of this target — same URL, same Figma node, same viewport set">
              Delta since run #13
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { k: "Fixed", v: 9, tone: T.pass, bg: T.passBg },
                { k: "Introduced", v: 2, tone: T.fix, bg: T.fixBg },
                { k: "Changed", v: 4, tone: T.almost, bg: T.almostBg },
                { k: "Unchanged", v: 21, tone: T.mute, bg: T.muteBg },
              ].map((s) => (
                <div key={s.k} className="p-3.5" style={{ borderRadius: 14, backgroundColor: s.bg }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.tone, letterSpacing: "-0.03em" }}>{s.v}</div>
                  <div style={{ fontSize: 11.5, color: T.ink2, marginTop: 2 }}>{s.k}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {[
                { d: "fixed", label: "font-weight", el: ".features .card h3", was: "500", now: "600" },
                { d: "introduced", label: "outline", el: "header .menu-toggle", was: "2px solid", now: "none" },
                { d: "changed", label: "gap", el: ".hero__stack", was: "30px", now: "26px" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-2.5" style={{ borderRadius: 12, backgroundColor: T.sunken }}>
                  <Pill fg={r.d === "fixed" ? T.pass : r.d === "introduced" ? T.fix : T.almost}
                    bg={r.d === "fixed" ? T.passBg : r.d === "introduced" ? T.fixBg : T.almostBg}>{r.d}</Pill>
                  <span className="font-mono truncate" style={{ fontSize: 12, color: T.ink }}>{r.label}</span>
                  <span className="font-mono truncate hidden sm:block" style={{ fontSize: 11.5, color: T.ink3 }}>{r.el}</span>
                  <span className="ml-auto flex items-center gap-1.5 font-mono shrink-0" style={{ fontSize: 11.5 }}>
                    <span style={{ color: T.ink3, textDecoration: "line-through" }}>{r.was}</span>
                    <ArrowRight size={11} color={T.ink3} />
                    <span style={{ color: T.ink, fontWeight: 600 }}>{r.now}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em" }}>Targets</h2>
              <button className="flex items-center gap-1 font-medium" style={{ fontSize: 12, color: T.accent }}>View all <ChevronRight size={12} /></button>
            </div>
            {TARGETS.map((t) => (
              <button key={t.name} onClick={() => go("scan")}
                className="w-full text-left px-5 py-3.5 dk-hover transition-colors" style={{ borderTop: `1px solid ${T.line}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.score >= 85 ? T.pass : t.score >= 70 ? T.almost : T.fix, fontVariantNumeric: "tabular-nums" }}>{t.score}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="font-mono truncate" style={{ fontSize: 11, color: T.ink3, maxWidth: 160 }}>{t.url}</span>
                  <Pill fg={t.state === "reliable" ? T.pass : T.almost} bg={t.state === "reliable" ? T.passBg : T.almostBg}>{t.state}</Pill>
                  <span style={{ fontSize: 11, color: T.ink3 }}>{t.runs} runs</span>
                </div>
              </button>
            ))}
          </Card>

          <Card className="p-5">
            <SectionTitle sub="Phantom verdict tally — the score is pass ÷ (pass + almost + fix)">Verdicts</SectionTitle>
            <div className="space-y-2">
              {[
                { k: "pass", v: 604 }, { k: "almost", v: 21 }, { k: "fix", v: 34 },
                { k: "intentional", v: 12 }, { k: "blocked", v: 3 }, { k: "unchecked", v: 38 },
              ].map((r) => {
                const cfg = VERDICT[r.k];
                return (
                  <div key={r.k} className="flex items-center gap-3">
                    <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: cfg.dot }} />
                    <span className="flex-1" style={{ fontSize: 12.5, color: T.ink2 }}>{cfg.label}</span>
                    <div style={{ width: 70, height: 4, borderRadius: 999, backgroundColor: T.track }}>
                      <div style={{ width: `${(r.v / 604) * 100}%`, height: 4, borderRadius: 999, backgroundColor: cfg.dot }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.line}`, fontSize: 11, color: T.ink3, lineHeight: 1.5 }}>
              Unchecked is not a pass. Where the design says nothing, the finding is reported as unverified.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — DQA SCAN
   ═══════════════════════════════════════════════════════════════════════════ */

function FindingRow({ f, expanded, onToggle, onAccept }) {
  const v = VERDICT[f.verdict];
  return (
    <div style={{ borderTop: `1px solid ${T.line}` }}>
      <button onClick={onToggle}
        className="w-full text-left px-5 py-3.5 flex items-center gap-4 dk-hover transition-colors"
        style={{ backgroundColor: expanded ? T.sunken : "transparent" }}>
        <span className="shrink-0" style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: v.dot }} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{f.property}</span>
            {f.tokenRef && <Pill fg={T.accent} bg={T.accentSoft}>{f.tokenRef}</Pill>}
            {f.accepted && <Pill><Ban size={10} /> accepted</Pill>}
            {f.confidence < 75 && <Pill fg={T.almost} bg={T.almostBg}>{f.confidence}% match</Pill>}
          </span>
          <span className="flex items-center gap-1.5 mt-1" style={{ fontSize: 12, color: T.ink3 }}>
            <span className="truncate" style={{ maxWidth: 190, fontStyle: f.layer ? "normal" : "italic" }}>
              {f.layer || "no design counterpart"}
            </span>
            <ChevronRight size={11} />
            <span className="truncate font-mono" style={{ maxWidth: 210, fontSize: 11.5, color: T.ink2 }}>{f.selector || "unmapped"}</span>
          </span>
        </span>
        <span className="hidden xl:flex items-center gap-2.5 shrink-0" style={{ fontSize: 12 }}>
          <span className="font-mono truncate" style={{ maxWidth: 160, color: T.ink2 }} title={f.expected}>{f.expected}</span>
          <ArrowRight size={11} color={T.ink3} />
          <span className="font-mono truncate" style={{ maxWidth: 160, fontWeight: 600, color: f.verdict === "fix" ? T.fix : T.ink }} title={f.actual || "—"}>{f.actual || "—"}</span>
        </span>
        <span className="shrink-0"><VerdictPill verdict={f.verdict} /></span>
        <ChevronDown size={15} color={T.ink3} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1" style={{ backgroundColor: T.sunken }}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label>Why it matters</Label>
                <p className="mt-1.5" style={{ fontSize: 13, lineHeight: 1.55, color: T.ink2 }}>{f.why}</p>
              </div>

              {f.textSample && (
                <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                  <Label>Specimen — real copy, both sizes</Label>
                  <div className="mt-2.5 space-y-1.5">
                    <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-1.12px", color: T.ink }}>{f.textSample}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0px", color: T.ink3 }}>{f.textSample}</div>
                  </div>
                  <div className="flex gap-4 mt-2" style={{ fontSize: 10.5, color: T.ink3 }}><span>design</span><span>build</span></div>
                </div>
              )}

              {f.delta != null && (
                <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                  <Label>Tolerance</Label>
                  <div className="mt-1"><ToleranceRuler delta={f.delta} unit={f.unit} closeBand={f.closeBand} fixBand={f.fixBand} /></div>
                </div>
              )}

              {f.fix && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Suggested fix — the design declaration, verbatim</Label>
                    <CopyButton />
                  </div>
                  <pre className="font-mono overflow-x-auto p-3.5"
                    style={{ borderRadius: 14, fontSize: 12, lineHeight: 1.6, backgroundColor: T.codeBg, color: T.codeFg, margin: 0 }}>{f.fix}</pre>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* An invariant has nothing to map — it is measured on the rendered
                  page alone — so it gets no confidence bar and no override. */}
              {f.strategy === "invariant" ? (
                <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                  <Label>Invariant</Label>
                  <div className="mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} color={T.pass} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>No design reference needed</span>
                  </div>
                  <div className="mt-2" style={{ fontSize: 11.5, color: T.ink2, lineHeight: 1.5 }}>{f.evidence}</div>
                </div>
              ) : (
                <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                  <Label>Mapping</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1" style={{ height: 4, borderRadius: 999, backgroundColor: T.track }}>
                      <div style={{ width: `${f.confidence}%`, height: 4, borderRadius: 999, backgroundColor: f.confidence >= 90 ? T.pass : f.confidence >= 75 ? T.almost : T.fix }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{f.confidence}</span>
                  </div>
                  <div className="mt-2" style={{ fontSize: 11.5, color: T.ink2, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: T.ink }}>{f.strategy}</span> — {f.evidence}
                  </div>
                  <button className="mt-3 w-full py-2 font-medium dk-hover-soft transition-colors"
                    style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>Override mapping</button>
                </div>
              )}

              {f.source && (
                <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                  <Label>Set in</Label>
                  <div className="mt-2 font-mono" style={{ fontSize: 11.5, color: T.ink, wordBreak: "break-all" }}>{f.source.file}:{f.source.line}</div>
                  <div className="mt-1 font-mono" style={{ fontSize: 11, color: T.ink3 }}>{f.source.selector} · {f.source.authored}</div>
                  {f.source.important && <div className="mt-2"><Pill fg={T.fix} bg={T.fixBg}>!important</Pill></div>}
                </div>
              )}

              <div className="p-4 dk-surface" style={{ borderRadius: 14 }}>
                <Label>Seen at</Label>
                <div className="flex gap-1.5 mt-2">
                  {VIEWPORTS.map((vp) => {
                    const hit = f.viewports.includes(vp.id);
                    const Icon = vp.icon;
                    return (
                      <span key={vp.id} className="flex items-center gap-1 px-2 py-1"
                        style={{ borderRadius: 999, fontSize: 11, backgroundColor: hit ? T.fixBg : T.muteBg, color: hit ? T.fix : T.ink3 }}>
                        <Icon size={11} />{vp.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {f.accepted ? (
                <div className="p-4" style={{ borderRadius: 14, backgroundColor: T.ink }}>
                  <Label color="rgba(255,255,255,.55)">Accepted deviation</Label>
                  <div className="mt-1.5" style={{ fontSize: 12, color: T.onInk, lineHeight: 1.5 }}>{f.accepted.reason}</div>
                  <div className="mt-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
                    {f.accepted.author} · {f.accepted.at} · premise still {f.accepted.premise}
                  </div>
                  <button onClick={() => onAccept(f.id, false)} className="mt-3 w-full py-2 font-medium"
                    style={{ borderRadius: 999, fontSize: 12, backgroundColor: "rgba(255,255,255,.12)", color: T.onInk }}>Reopen finding</button>
                </div>
              ) : (
                <button onClick={() => onAccept(f.id, true)}
                  className="w-full py-2.5 font-medium flex items-center justify-center gap-1.5 dk-hover-soft transition-colors dk-surface"
                  style={{ borderRadius: 14, fontSize: 12, color: T.ink2, boxShadow: `inset 0 0 0 1px ${T.line}` }}>
                  <Ban size={13} /> Accept this deviation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanTab() {
  const w = useWidth();
  const twoCol = w >= 1180;
  const [target, setTarget] = useState({
    devUrl: "https://staging.acme.com/pricing",
    figmaUrl: "figma.com/design/9Kx…?node-id=214-1180",
    scope: "section.pricing",
    viewports: ["desktop", "tablet", "mobile"],
  });
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [verdicts, setVerdicts] = useState(["fix", "almost"]);
  const [showAccepted, setShowAccepted] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0);
  const [expanded, setExpanded] = useState("f-01");
  const [accepted, setAccepted] = useState({});
  const [view, setView] = useState("findings");
  const [compareMode, setCompareMode] = useState("split");
  const [wipe, setWipe] = useState(50);
  const rail = useRef(null);

  useEffect(() => {
    if (!scanning) return;
    if (stage >= PIPELINE.length - 1) {
      const t = setTimeout(() => { setScanning(false); setStage(0); }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 400);
    return () => clearTimeout(t);
  }, [scanning, stage]);

  const findings = useMemo(() => FINDINGS
    .map((f) => accepted[f.id] === true
      ? { ...f, verdict: "intentional", accepted: f.accepted || { author: "You", reason: "Accepted from the findings list", at: "just now", premise: f.expected } }
      : accepted[f.id] === false ? { ...f, verdict: f.id === "f-06" ? "almost" : f.verdict, accepted: null } : f)
    .filter((f) => (category ? f.category === category : true))
    .filter((f) => f.verdict === "intentional" ? showAccepted : verdicts.includes(f.verdict))
    .filter((f) => f.confidence >= minConfidence)
    .filter((f) => !query.trim() || [f.property, f.layer, f.selector, f.section, f.expected, f.actual].join(" ").toLowerCase().includes(query.toLowerCase())),
    [category, verdicts, showAccepted, minConfidence, query, accepted]);

  const grouped = useMemo(() => {
    const m = {};
    findings.forEach((f) => { (m[f.section] ||= []).push(f); });
    return SECTION_ORDER.filter((s) => m[s]?.length).map((s) => ({ section: s, items: m[s] }));
  }, [findings]);

  return (
    <div className="grid gap-5 items-start" style={{ gridTemplateColumns: twoCol ? "minmax(0,1fr) 336px" : "minmax(0,1fr)" }}>
      <div className="min-w-0 space-y-5">
        {/* Category rail — horizontally scrolling summary cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em" }}>By category</h2>
              <Pill>{CATEGORIES.length} tracked</Pill>
            </div>
            <div className="flex gap-1">
              <button onClick={() => rail.current?.scrollBy({ left: -260, behavior: "smooth" })}
                className="flex items-center justify-center hover:dk-surface transition-colors" style={{ width: 26, height: 26, borderRadius: 999 }}>
                <ChevronRight size={15} color={T.ink2} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button onClick={() => rail.current?.scrollBy({ left: 260, behavior: "smooth" })}
                className="flex items-center justify-center hover:dk-surface transition-colors" style={{ width: 26, height: 26, borderRadius: 999 }}>
                <ChevronRight size={15} color={T.ink2} />
              </button>
            </div>
          </div>
          <div ref={rail} className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((c) => {
              const Icon = c.icon, on = category === c.id, na = c.score == null;
              const tone = na ? T.ink3 : c.score >= 90 ? T.pass : c.score >= 75 ? T.almost : T.fix;
              return (
                <button key={c.id} onClick={() => setCategory(on ? null : c.id)} className="text-left shrink-0 p-4 transition-all"
                  style={{ minWidth: 172, borderRadius: 16, backgroundColor: on ? T.ink : T.onInk, boxShadow: on ? T.shadowLift : T.shadow, color: on ? T.onInk : T.ink }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: on ? "rgba(255,255,255,.12)" : T.muteBg }}>
                      <Icon size={14} color={on ? T.onInk : T.ink2} />
                    </span>
                    <Pill fg={on ? T.onInk : na ? T.ink3 : tone} bg={on ? "rgba(255,255,255,.12)" : na ? T.muteBg : (c.score >= 90 ? T.passBg : c.score >= 75 ? T.almostBg : T.fixBg)}>
                      {na ? "n/a" : `${c.open} open`}
                    </Pill>
                  </div>
                  <div className="mt-3.5" style={{ fontSize: 12.5, fontWeight: 500, color: on ? "rgba(255,255,255,.72)" : T.ink2 }}>{c.label}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{na ? "—" : c.score}</span>
                    <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,.55)" : T.ink3 }}>{na ? "nothing to check" : `${c.checks} checks`}</span>
                  </div>
                  <div className="mt-3" style={{ height: 3, borderRadius: 999, backgroundColor: on ? "rgba(255,255,255,.16)" : T.track }}>
                    <div style={{ width: `${na ? 0 : c.score}%`, height: 3, borderRadius: 999, backgroundColor: on ? T.onInk : tone }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 p-1 dk-surface" style={{ borderRadius: 999, boxShadow: T.shadow, width: "fit-content" }}>
          {[
            { id: "findings", label: "Findings", n: findings.length },
            { id: "coverage", label: "Layer coverage", n: 161 },
            { id: "unmatched", label: "Unmatched", n: UNMATCHED.length },
            { id: "map", label: "Error map", n: null },
            { id: "visual", label: "Visual check", n: null },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} className="flex items-center gap-1.5 px-3.5 py-1.5 font-medium transition-colors"
              style={{ borderRadius: 999, fontSize: 12.5, backgroundColor: view === v.id ? T.ink : "transparent", color: view === v.id ? T.onInk : T.ink2 }}>
              {v.label}{v.n != null && <span style={{ opacity: .6 }}>{v.n}</span>}
            </button>
          ))}
        </div>

        {view === "findings" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em" }}>Findings</h2>
                <Pill>{findings.length} shown</Pill>
                {category && (
                  <button onClick={() => setCategory(null)}>
                    <Pill fg={T.accent} bg={T.accentSoft}>{CATEGORIES.find((c) => c.id === category)?.label} <X size={10} /></Pill>
                  </button>
                )}
              </div>
              <span style={{ fontSize: 11.5, color: T.ink3 }}>grouped by page section, top to bottom</span>
            </div>

            {grouped.length === 0 ? (
              <div className="px-5 py-14 text-center" style={{ borderTop: `1px solid ${T.line}` }}>
                <div className="mx-auto flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: T.muteBg }}>
                  <Search size={17} color={T.ink3} />
                </div>
                <div className="mt-3" style={{ fontSize: 13.5, fontWeight: 600 }}>No findings match these filters</div>
                <p className="mt-1" style={{ fontSize: 12.5, color: T.ink2 }}>Widen the verdict filter, or lower the confidence floor.</p>
              </div>
            ) : grouped.map((g) => (
              <div key={g.section}>
                <div className="px-5 py-2 flex items-center gap-2" style={{ backgroundColor: T.sunken2, borderTop: `1px solid ${T.line}` }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2 }}>{g.section}</span>
                  <span style={{ fontSize: 11, color: T.ink3 }}>{g.items.length}</span>
                </div>
                {g.items.map((f) => (
                  <FindingRow key={f.id} f={f} expanded={expanded === f.id}
                    onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
                    onAccept={(id, val) => setAccepted((p) => ({ ...p, [id]: val }))} />
                ))}
              </div>
            ))}

            <div className="px-5 py-3.5 flex items-center gap-2 flex-wrap" style={{ borderTop: `1px solid ${T.line}` }}>
              <CheckCircle2 size={13} color={T.pass} />
              <span style={{ fontSize: 11.5, color: T.ink3 }}>Checked and clean:</span>
              {CLEAN_SECTIONS.map((s) => <Pill key={s} fg={T.pass} bg={T.passBg}>{s}</Pill>)}
            </div>
          </Card>
        )}

        {view === "coverage" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <SectionTitle sub="Every design layer and whether it reached the build — parents before children, in the designer's own order">
                Layer coverage
              </SectionTitle>
              <div className="flex gap-2 flex-wrap">
                <Pill fg={T.pass} bg={T.passBg}>142 matched</Pill>
                <Pill fg={T.almost} bg={T.almostBg}>7 need review</Pill>
                <Pill fg={T.fix} bg={T.fixBg}>12 unmatched</Pill>
                <Pill>19 paint nothing</Pill>
              </div>
            </div>
            {[
              { d: 0, name: "Pricing section", type: "FRAME", matched: true, conf: 98, paints: true, checks: "18/18" },
              { d: 1, name: "Heading group", type: "FRAME", matched: true, conf: 94, paints: false, checks: "6/6" },
              { d: 2, name: "Eyebrow", type: "TEXT", matched: true, conf: 97, paints: true, checks: "9/9" },
              { d: 2, name: "Title", type: "TEXT", matched: true, conf: 96, paints: true, checks: "7/9" },
              { d: 1, name: "Plan row", type: "FRAME", matched: true, conf: 88, paints: false, checks: "5/6" },
              { d: 2, name: "Plan card", type: "INSTANCE", matched: false, conf: 41, paints: true, checks: "0/14" },
              { d: 3, name: "Badge / Popular", type: "TEXT", matched: false, conf: 0, paints: true, checks: "0/8" },
              { d: 1, name: "Frame 427", type: "FRAME", matched: false, conf: 0, paints: false, checks: "0/0" },
            ].map((l, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center gap-3" style={{ borderTop: `1px solid ${T.line}` }}>
                <span style={{ width: l.d * 16 }} />
                <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: l.matched ? T.pass : l.paints ? T.fix : T.ink3 }} />
                <span className="truncate" style={{ fontSize: 12.5, fontWeight: l.d === 0 ? 600 : 500, color: T.ink }}>{l.name}</span>
                <Pill>{l.type}</Pill>
                {!l.matched && !l.paints && <Pill title="A positioning wrapper that draws nothing — usually fine">wrapper</Pill>}
                {!l.matched && l.paints && <Pill fg={T.fix} bg={T.fixBg}>hole in the report</Pill>}
                <span className="ml-auto flex items-center gap-3 shrink-0" style={{ fontSize: 11.5, color: T.ink3 }}>
                  <span className="font-mono">{l.checks}</span>
                  <span style={{ width: 30, textAlign: "right", fontWeight: 600, color: l.conf >= 90 ? T.pass : l.conf >= 75 ? T.almost : T.fix }}>{l.conf || "—"}</span>
                </span>
              </div>
            ))}
          </Card>
        )}

        {view === "unmatched" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4">
              <SectionTitle sub="A bare count of unmatched layers tells you nothing to act on — the reason points at a fix">
                Unmatched nodes
              </SectionTitle>
            </div>
            {UNMATCHED.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-start gap-3" style={{ borderTop: `1px solid ${T.line}` }}>
                <Pill fg={u.source === "figma" ? T.accent : T.ink2} bg={u.source === "figma" ? T.accentSoft : T.muteBg}>
                  {u.source === "figma" ? "missing" : "unexpected"}
                </Pill>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: T.ink3 }}>{u.id}</span>
                  </div>
                  <div className="mt-1" style={{ fontSize: 12, color: T.ink2 }}>
                    {u.reason === "no-candidate" && "No candidate element was found in the scanned region."}
                    {u.reason === "below-threshold" && `Closest candidate ${u.nearest.name} scored ${u.nearest.confidence} — under the 60 floor.`}
                    {u.reason === "claimed-by-another" && `${u.nearest.name} matched a different layer first at ${u.nearest.confidence}.`}
                    {u.text && <span style={{ color: T.ink3 }}> · “{u.text}”</span>}
                  </div>
                </div>
                <button className="shrink-0 px-3 py-1.5 font-medium dk-hover-soft transition-colors"
                  style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>Map manually</button>
              </div>
            ))}
          </Card>
        )}

        {view === "map" && (
          <ErrorMap
            findings={findings}
            selected={expanded}
            onSelect={(id) => setExpanded(expanded === id ? null : id)}
            onAccept={(id, val) => setAccepted((p) => ({ ...p, [id]: val }))}
          />
        )}

        {view === "visual" && (
          <Card className="p-5">
            <SectionTitle sub="Supporting evidence only. Nothing is a finding because two pictures differ — the comparison runs on DOM, computed CSS and the accessibility tree.">
              Visual check
            </SectionTitle>
            <div className="flex items-center gap-1 p-1 mb-4" style={{ borderRadius: 999, backgroundColor: T.muteBg, width: "fit-content" }}>
              {["split", "overlay", "wipe"].map((m) => (
                <button key={m} onClick={() => setCompareMode(m)} className="px-3.5 py-1.5 font-medium capitalize transition-colors"
                  style={{ borderRadius: 999, fontSize: 12, backgroundColor: compareMode === m ? T.onInk : "transparent", color: compareMode === m ? T.ink : T.ink2, boxShadow: compareMode === m ? T.shadow : "none" }}>{m}</button>
              ))}
            </div>
            <div className="relative overflow-hidden" style={{ borderRadius: 14, backgroundColor: T.sunken, height: 300 }}>
              {compareMode === "split" ? (
                <div className="grid grid-cols-2 h-full" style={{ gap: 1, backgroundColor: T.line }}>
                  <MockPage label="Design · Figma 214-1180" tint={T.accent} drift={0} />
                  <MockPage label="Build · 1440×900" tint="#4C3EF7" drift={4} />
                </div>
              ) : compareMode === "overlay" ? (
                <div className="relative h-full">
                  <MockPage label="Design over build · 50% opacity" tint={T.accent} drift={0} />
                  <div className="absolute inset-0" style={{ opacity: .5 }}><MockPage label="" tint="#4C3EF7" drift={4} /></div>
                </div>
              ) : (
                <div className="relative h-full">
                  <MockPage label="" tint="#4C3EF7" drift={4} />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${wipe}%` }}>
                    <div style={{ width: `${10000 / wipe}%`, height: "100%" }}><MockPage label="" tint={T.accent} drift={0} /></div>
                  </div>
                  <div className="absolute top-0 bottom-0" style={{ left: `${wipe}%`, width: 2, backgroundColor: T.ink }} />
                </div>
              )}
            </div>
            {compareMode === "wipe" && (
              <input type="range" min={0} max={100} value={wipe} onChange={(e) => setWipe(Number(e.target.value))}
                className="w-full mt-3" style={{ accentColor: T.ink }} />
            )}
          </Card>
        )}
      </div>

      {/* Sticky action rail */}
      <aside className={twoCol ? "sticky self-start space-y-4" : "space-y-4"} style={twoCol ? { top: 20 } : undefined}>
        <Card lift className="p-5">
          <div className="flex items-center justify-between">
            <Label>Target</Label>
            <button className="flex items-center gap-1 px-2 py-1 dk-hover-soft transition-colors" style={{ borderRadius: 999, fontSize: 11, color: T.ink2 }}>
              <History size={11} /> 14 runs
            </button>
          </div>
          <div className="space-y-2 mt-3">
            <Field icon={Link2} value={target.devUrl} onChange={(v) => setTarget({ ...target, devUrl: v })} placeholder="https://…" mono />
            <Field icon={Layers} value={target.figmaUrl} onChange={(v) => setTarget({ ...target, figmaUrl: v })} placeholder="figma.com/design/…" mono />
            <Field icon={Crosshair} value={target.scope} onChange={(v) => setTarget({ ...target, scope: v })} placeholder="Page area — section.pricing" mono />
          </div>
          <p className="mt-2" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            Everything outside the page area is never collected, so it can't be matched by mistake.
          </p>

          <div className="mt-3.5">
            <Label>Viewports</Label>
            <div className="flex gap-1.5 mt-2">
              {VIEWPORTS.map((vp) => {
                const on = target.viewports.includes(vp.id), Icon = vp.icon;
                return (
                  <button key={vp.id} onClick={() => setTarget({ ...target, viewports: on ? target.viewports.filter((x) => x !== vp.id) : [...target.viewports, vp.id] })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 font-medium transition-colors"
                    style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: on ? T.ink : T.muteBg, color: on ? T.onInk : T.ink2 }}>
                    <Icon size={12} /> {vp.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => { setStage(0); setScanning(true); }} disabled={scanning}
            className="w-full mt-4 flex items-center justify-center gap-2 font-semibold"
            style={{ height: 44, borderRadius: 999, backgroundColor: T.accent, color: T.onInk, fontSize: 13.5, opacity: scanning ? .9 : 1 }}>
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <Play size={14} />}{scanning ? "Scanning…" : "Run scan"}
          </button>

          {scanning ? (
            <div className="mt-3">
              <div style={{ height: 3, borderRadius: 999, backgroundColor: T.track, overflow: "hidden" }}>
                <div style={{ width: `${((stage + 1) / PIPELINE.length) * 100}%`, height: 3, backgroundColor: T.accent, transition: "width .4s ease" }} />
              </div>
              <div className="mt-2 flex items-center gap-1.5" style={{ fontSize: 11.5, color: T.ink2 }}>
                <span style={{ color: T.ink3 }}>{stage + 1}/{PIPELINE.length}</span>{PIPELINE[stage]}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1.5" style={{ fontSize: 11, color: T.ink3 }}>
              <Info size={11} /> Run #14, 18 min ago · Figma from disk cache
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Label>Search & filter</Label>
            <button onClick={() => { setQuery(""); setVerdicts(["fix", "almost"]); setMinConfidence(0); setCategory(null); }}
              style={{ fontSize: 11, color: T.accent, fontWeight: 500 }}>Reset</button>
          </div>
          <div className="flex items-center gap-2 px-3 mb-3" style={{ height: 38, borderRadius: 12, backgroundColor: T.muteBg }}>
            <Search size={14} color={T.ink3} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Property, layer, selector…"
              className="w-full bg-transparent outline-none" style={{ fontSize: 12.5, color: T.ink }} />
            {query && <button onClick={() => setQuery("")}><X size={13} color={T.ink3} /></button>}
          </div>
          <Label>Verdict</Label>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
            {["fix", "almost", "pass", "unchecked", "blocked"].map((v) => {
              const on = verdicts.includes(v), cfg = VERDICT[v];
              return (
                <button key={v} onClick={() => setVerdicts((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])}
                  className="flex items-center gap-1.5 px-2.5 py-1 font-medium transition-colors"
                  style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: on ? cfg.bg : "transparent", color: on ? cfg.fg : T.ink3, boxShadow: on ? "none" : `inset 0 0 0 1px ${T.line}` }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: on ? cfg.dot : T.tick }} />{cfg.label}
                </button>
              );
            })}
          </div>
          <Label>Mapping confidence floor</Label>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <input type="range" min={0} max={100} step={5} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="flex-1" style={{ accentColor: T.ink }} />
            <span style={{ fontSize: 12, fontWeight: 600, width: 26, textAlign: "right" }}>{minConfidence}</span>
          </div>
          <p style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>90+ high · 75–89 medium · 60–74 low · below 60 unmapped</p>
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
            <Toggle on={showAccepted} onChange={setShowAccepted} label="Show accepted deviations" sub="12 active · 1 stale premise" />
          </div>
        </Card>

        <Card className="p-5">
          <Label>Dev handoff</Label>
          <div className="space-y-1.5 mt-3">
            {[
              { label: "Markdown", sub: "For a ticket or PR, with CSS grouped by selector" },
              { label: "Self-contained HTML", sub: "For someone without the tool" },
              { label: "CSS patch stub", sub: "Non-primary viewports wrapped in media queries" },
            ].map((e) => (
              <button key={e.label} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left dk-hover-soft transition-colors"
                style={{ borderRadius: 12, backgroundColor: T.muteBg }}>
                <Download size={14} color={T.ink2} />
                <span className="flex-1 min-w-0">
                  <span className="block" style={{ fontSize: 12.5, fontWeight: 500 }}>{e.label}</span>
                  <span className="block" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.4 }}>{e.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            Only findings whose fix is a literal CSS declaration reach the CSS output. Prose guidance is excluded rather than mangled into a comment.
          </p>
        </Card>
      </aside>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ERROR MAP — the whole page at once, with every finding pinned where it is.

   A findings list answers "what is wrong". It cannot answer "is all of this
   one broken component, or twelve unrelated ones?" — and that is usually the
   question that decides what you fix first. Both Skopos and Phantom keep a
   positional view for exactly this reason.
   ═══════════════════════════════════════════════════════════════════════════ */
function ErrorMap({ findings, selected, onSelect, onAccept }) {
  const [vp, setVp] = useState("desktop");
  const [hover, setHover] = useState(null);
  const [showClean, setShowClean] = useState(true);
  const [density, setDensity] = useState(false);

  const onVp = findings.filter((f) => f.viewports.includes(vp) && f.rect);
  const sel = findings.find((f) => f.id === selected) || null;
  const active = hover ? onVp.find((f) => f.id === hover) : sel;

  /* Page sections as bands down the canvas, so a marker reads as "in the
     feature grid" rather than "somewhere around 40% down". */
  const BANDS = [
    { name: "Nav", y: 0, h: 9 },
    { name: "Hero", y: 9, h: 26 },
    { name: "Feature grid", y: 35, h: 22 },
    { name: "Pricing", y: 57, h: 30 },
    { name: "Footer", y: 87, h: 13 },
  ];
  const bandCount = (b) => onVp.filter((f) => f.rect.y >= b.y && f.rect.y < b.y + b.h).length;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.015em" }}>Error map</h2>
          <p className="mt-0.5" style={{ fontSize: 12.5, color: T.ink2 }}>
            {onVp.length} of {findings.length} findings are visible at this viewport
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 p-1" style={{ borderRadius: 999, backgroundColor: T.muteBg }}>
            {VIEWPORTS.map((v) => {
              const Icon = v.icon, on = vp === v.id;
              return (
                <button key={v.id} onClick={() => setVp(v.id)} title={`${v.name} · ${v.w}px`}
                  className="flex items-center gap-1.5 px-2.5 py-1 font-medium transition-colors"
                  style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: on ? T.card : "transparent", color: on ? T.ink : T.ink2, boxShadow: on ? T.shadow : "none" }}>
                  <Icon size={12} /> {v.label}
                </button>
              );
            })}
          </span>
          <button onClick={() => setDensity(!density)} title="Colour bands by how many findings they hold"
            className="flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors"
            style={{ borderRadius: 999, fontSize: 12, backgroundColor: density ? T.ink : T.muteBg, color: density ? T.onInk : T.ink2 }}>
            <Layers size={13} /> Density
          </button>
        </div>
      </div>

      <div className="grid gap-0" style={{ gridTemplateColumns: "minmax(0,1fr) 300px", borderTop: `1px solid ${T.line}` }}>
        {/* ── the page canvas ── */}
        <div className="p-6" style={{ backgroundColor: T.canvas, borderRight: `1px solid ${T.line}` }}>
          <div className="mx-auto relative" style={{ maxWidth: vp === "mobile" ? 300 : vp === "tablet" ? 460 : 640 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono truncate" style={{ fontSize: 10.5, color: T.ink3 }}>staging.acme.com/pricing</span>
              <span className="font-mono" style={{ fontSize: 10.5, color: T.ink3 }}>
                {VIEWPORTS.find((v) => v.id === vp).w}px
              </span>
            </div>

            <div className="relative overflow-hidden dk-surface"
              style={{ borderRadius: 12, boxShadow: T.shadow, aspectRatio: vp === "mobile" ? "390/900" : vp === "tablet" ? "768/1100" : "1440/1150" }}>
              {/* section bands */}
              {BANDS.map((b) => {
                const n = bandCount(b);
                const heat = density && n ? Math.min(0.22, 0.06 + n * 0.045) : 0;
                return (
                  <div key={b.name} className="absolute left-0 right-0"
                    style={{ top: `${b.y}%`, height: `${b.h}%`, borderBottom: `1px dashed ${T.line}`, backgroundColor: heat ? `rgba(192,51,46,${heat})` : "transparent" }}>
                    <span className="absolute" style={{ left: 6, top: 4, fontSize: 8.5, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {b.name}{density && n ? ` · ${n}` : ""}
                    </span>
                  </div>
                );
              })}

              {/* the page itself, deliberately low-contrast so markers read on top */}
              <div style={{ opacity: 0.5 }}><MockPage label="" tint={T.accent} drift={vp === "mobile" ? 3 : 0} /></div>

              {/* findings, pinned */}
              {onVp.map((f) => {
                const v = VERDICT[f.verdict];
                const isOn = active?.id === f.id;
                return (
                  <button key={f.id}
                    onClick={() => onSelect(f.id)}
                    onMouseEnter={() => setHover(f.id)}
                    onMouseLeave={() => setHover(null)}
                    title={`${f.property} — ${f.layer || f.selector}`}
                    className="absolute transition-all"
                    style={{
                      left: `${f.rect.x}%`, top: `${f.rect.y}%`,
                      width: `${f.rect.w}%`, height: `${f.rect.h}%`,
                      borderRadius: 4,
                      outline: `${isOn ? 2 : 1.5}px solid ${v.dot}`,
                      outlineOffset: isOn ? 1 : 0,
                      backgroundColor: isOn ? `${v.bg}` : "transparent",
                      opacity: isOn ? 1 : 0.85,
                      zIndex: isOn ? 3 : 1,
                    }}>
                    <span className="absolute flex items-center justify-center font-semibold"
                      style={{
                        top: -7, left: -7, minWidth: 15, height: 15, padding: "0 4px",
                        borderRadius: 999, backgroundColor: v.dot, color: T.onInk, fontSize: 9,
                        boxShadow: `0 0 0 2px ${T.card}`,
                      }}>
                      {onVp.indexOf(f) + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {["fix", "almost", "intentional"].map((k) => (
                <span key={k} className="flex items-center gap-1.5" style={{ fontSize: 11, color: T.ink2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, outline: `1.5px solid ${VERDICT[k].dot}` }} />
                  {VERDICT[k].label}
                </span>
              ))}
              {showClean && (
                <span className="ml-auto flex items-center gap-1.5" style={{ fontSize: 11, color: T.ink3 }}>
                  <CheckCircle2 size={11} color={T.pass} />
                  {CLEAN_SECTIONS.join(" and ")} checked clean — nothing to pin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── the legend / detail rail ── */}
        <div className="flex flex-col" style={{ maxHeight: 620 }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.line}` }}>
            <Label>{active ? "Selected" : "All markers"}</Label>
          </div>

          {active ? (
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <VerdictPill verdict={active.verdict} />
                <Pill>{active.section}</Pill>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 650 }}>{active.property}</div>
                <div className="font-mono mt-1" style={{ fontSize: 11.5, color: T.ink2, wordBreak: "break-all" }}>{active.selector}</div>
                <div className="mt-0.5" style={{ fontSize: 11.5, color: T.ink3, fontStyle: active.layer ? "normal" : "italic" }}>
                  {active.layer || "no design counterpart"}
                </div>
              </div>
              <div className="p-3" style={{ borderRadius: 12, backgroundColor: T.sunken }}>
                <div className="flex items-center gap-2 font-mono" style={{ fontSize: 11.5 }}>
                  <span style={{ color: T.ink2 }}>{active.expected}</span>
                  <ArrowRight size={11} color={T.ink3} />
                  <span style={{ fontWeight: 600, color: active.verdict === "fix" ? T.fix : T.ink }}>{active.actual || "—"}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: T.ink2, lineHeight: 1.55 }}>{active.why}</p>
              {active.rect && (
                <div className="space-y-0.5">
                  <Row k="Position on page" v={`${active.rect.x}% × ${active.rect.y}%`} mono />
                  <Row k="Seen at" v={active.viewports.join(", ")} />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => onSelect(active.id)} className="flex-1 py-2 font-medium"
                  style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg, color: T.ink2 }}>
                  Deselect
                </button>
                {!active.accepted && (
                  <button onClick={() => onAccept(active.id, true)} className="flex items-center gap-1.5 px-3 py-2 font-medium"
                    style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg, color: T.ink2 }}>
                    <Ban size={12} /> Accept
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {onVp.length === 0 ? (
                <div className="px-4 py-10 text-center" style={{ fontSize: 12.5, color: T.ink2 }}>
                  Nothing pinned at this viewport.
                </div>
              ) : onVp.map((f, i) => {
                const v = VERDICT[f.verdict];
                return (
                  <button key={f.id} onClick={() => onSelect(f.id)}
                    onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 dk-hover transition-colors"
                    style={{ borderBottom: `1px solid ${T.line}` }}>
                    <span className="flex items-center justify-center shrink-0 font-semibold"
                      style={{ minWidth: 17, height: 17, borderRadius: 999, backgroundColor: v.dot, color: T.onInk, fontSize: 9.5 }}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>{f.property}</span>
                      <span className="block truncate font-mono" style={{ fontSize: 10.5, color: T.ink3 }}>{f.selector}</span>
                    </span>
                    <span className="shrink-0" style={{ fontSize: 10.5, color: T.ink3 }}>{f.section}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-auto px-4 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
            <p style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
              Positions are measured within the scanned region, not the whole document — a scoped
              scan maps against its own frame. Findings with no rendered box (an unmatched layer)
              cannot be pinned and stay in the findings list.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MockPage({ label, tint, drift }) {
  return (
    <div className="relative h-full w-full" style={{ backgroundColor: "#FFFFFF" }}>
      <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="300" fill="#FFFFFF" />
        <rect x="0" y="0" width="400" height="26" fill="#F4F5F7" />
        <rect x="18" y="9" width="44" height="7" rx="2" fill="#1A1A1A" />
        <rect x={330 - drift} y="8" width={52 + drift} height="10" rx="4" fill={tint} />
        <rect x="18" y={52 + drift} width="200" height="14" rx="3" fill="#1A1A1A" />
        <rect x="18" y={72 + drift} width="150" height="14" rx="3" fill="#1A1A1A" />
        <rect x="18" y={104 + drift} width="180" height="5" rx="2" fill="#9CA3AF" />
        <rect x="18" y={116 + drift} width="140" height="5" rx="2" fill="#9CA3AF" />
        <rect x="18" y={138 + drift} width={58 + drift * 2} height={18 + drift} rx={6} fill={tint} />
        <g fill="#F9FAFB" stroke="#E5E7EB">
          <rect x="18" y={186 + drift} width="112" height="70" rx="8" />
          <rect x={142 + drift} y={186 + drift} width="112" height="70" rx="8" />
          <rect x={266 + drift * 2} y={186 + drift} width="112" height="70" rx="8" />
        </g>
      </svg>
      {label && (
        <span className="absolute bottom-2 left-2 px-2 py-1" style={{ borderRadius: 999, fontSize: 10, backgroundColor: "rgba(9,9,11,.7)", color: T.onInk }}>{label}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — ACCESSIBILITY
   ═══════════════════════════════════════════════════════════════════════════ */

function AccessibilityTab() {
  const [bucket, setBucket] = useState("violations");
  const [open, setOpen] = useState("color-contrast");
  const [showWorking, setShowWorking] = useState(false);

  const IMPACT = { critical: { w: 10, fg: T.fix, bg: T.fixBg }, serious: { w: 6, fg: T.fix, bg: T.fixBg }, moderate: { w: 3, fg: T.almost, bg: T.almostBg }, minor: { w: 1, fg: T.mute, bg: T.muteBg } };

  return (
    <div className="space-y-5">
      {/* Same auto-fit grid as Overview — four across when there's room, two,
          then one. `lg:grid-cols-4` needed 1024px, which the content column
          rarely clears once the nav takes its 248. */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))" }}>
        <ScoreModule title="Accessibility" value={71} delta={-3} tone={T.fix} sub="axe-core + 7 custom checks" />
        {[
          { label: "Violations", n: 11, tone: T.fix, sub: "Determined to fail — these deduct" },
          { label: "Needs review", n: 3, tone: T.almost, sub: "The rule ran and could not decide — never deducts" },
          { label: "Rules passed", n: 77, tone: T.pass, sub: "Ran, found nothing — this is the denominator" },
        ].map((c) => (
          <Card key={c.label} className="p-4 flex flex-col">
            <Label className="truncate">{c.label}</Label>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.035em", marginTop: 8, color: c.tone, fontVariantNumeric: "tabular-nums" }}>{c.n}</div>
            <div style={{ fontSize: 11.5, color: T.ink2, marginTop: 5, lineHeight: 1.45 }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Published arithmetic */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: T.accentSoft }}>
              <Sparkles size={15} color={T.accent} />
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>The score is checkable by hand</div>
              <div className="font-mono mt-0.5" style={{ fontSize: 12, color: T.ink2 }}>100 × 0.5^(deduction ÷ 40) = 71</div>
            </div>
          </div>
          <button onClick={() => setShowWorking(!showWorking)} className="px-3 py-1.5 font-medium"
            style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>{showWorking ? "Hide" : "Show"} the working</button>
        </div>
        {showWorking && (
          <div className="mt-4 pt-4 grid gap-4 md:grid-cols-2" style={{ borderTop: `1px solid ${T.line}` }}>
            <div>
              <Label>Deduction</Label>
              <div className="mt-2 space-y-1">
                <Row k="critical × 2 @ weight 10" v="20.0" mono />
                <Row k="serious × 7 @ weight 6" v="42.0" mono />
                <Row k="moderate × 2 @ weight 3" v="6.0" mono />
                <Row k="repeat surcharge (+25% each, capped at 10)" v="+7.5" mono />
                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: `1px solid ${T.line}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Total deduction</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 700 }}>75.5</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <p className="mt-2" style={{ fontSize: 12, color: T.ink2, lineHeight: 1.6 }}>
                Needs-review findings never deduct. The half-life of 40 is chosen, not measured — if you calibrate it against a corpus, update this note in the same commit.
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-1 p-1 dk-surface" style={{ borderRadius: 999, boxShadow: T.shadow, width: "fit-content" }}>
        {[
          { id: "violations", label: "Violations", n: A11Y_VIOLATIONS.length },
          { id: "review", label: "Needs review", n: A11Y_REVIEW.length },
          { id: "notchecked", label: "Not checked", n: A11Y_NOT_CHECKED.length },
          { id: "reading", label: "Screen reader", n: null },
        ].map((b) => (
          <button key={b.id} onClick={() => setBucket(b.id)} className="flex items-center gap-1.5 px-3.5 py-1.5 font-medium transition-colors"
            style={{ borderRadius: 999, fontSize: 12.5, backgroundColor: bucket === b.id ? T.ink : "transparent", color: bucket === b.id ? T.onInk : T.ink2 }}>
            {b.label}{b.n != null && <span style={{ opacity: .6 }}>{b.n}</span>}
          </button>
        ))}
      </div>

      {bucket === "violations" && (
        <Card className="overflow-hidden">
          {A11Y_VIOLATIONS.map((v) => {
            const imp = IMPACT[v.impact], isOpen = open === v.id;
            return (
              <div key={v.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <button onClick={() => setOpen(isOpen ? null : v.id)}
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3.5 dk-hover transition-colors"
                  style={{ backgroundColor: isOpen ? T.sunken : "transparent" }}>
                  <Pill fg={imp.fg} bg={imp.bg}>{v.impact}</Pill>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{v.id}</span>
                      <Pill>WCAG {v.wcag}</Pill>
                      <Pill fg={v.source === "axe-core" ? T.ink2 : T.accent} bg={v.source === "axe-core" ? T.muteBg : T.accentSoft}>{v.source}</Pill>
                    </span>
                    <span className="block mt-1 truncate" style={{ fontSize: 12, color: T.ink2 }}>{v.what}</span>
                  </span>
                  <span className="shrink-0" style={{ fontSize: 12, color: T.ink3 }}>{v.count} elements</span>
                  <ChevronDown size={15} color={T.ink3} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 grid gap-4 lg:grid-cols-3" style={{ backgroundColor: T.sunken }}>
                    <div className="lg:col-span-2 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="p-3.5 dk-surface" style={{ borderRadius: 12 }}>
                          <Label>Build</Label>
                          <div className="mt-1.5 font-mono" style={{ fontSize: 12, color: T.fix, lineHeight: 1.5 }}>{v.what}</div>
                        </div>
                        <div className="p-3.5 dk-surface" style={{ borderRadius: 12 }}>
                          <Label>Requirement</Label>
                          <div className="mt-1.5 font-mono" style={{ fontSize: 12, color: T.ink2, lineHeight: 1.5 }}>{v.need}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.6 }}>{v.note}</p>
                      {v.fix && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5"><Label>Fix</Label><CopyButton /></div>
                          <pre className="font-mono overflow-x-auto p-3.5" style={{ borderRadius: 12, fontSize: 12, lineHeight: 1.6, backgroundColor: T.codeBg, color: T.codeFg, margin: 0 }}>{v.fix}</pre>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="p-3.5 dk-surface" style={{ borderRadius: 12 }}>
                        <Label>Element</Label>
                        <div className="mt-1.5 font-mono" style={{ fontSize: 11.5, color: T.ink, wordBreak: "break-all" }}>{v.element}</div>
                      </div>
                      <div className="p-3.5 dk-surface" style={{ borderRadius: 12 }}>
                        <Label>Weight</Label>
                        <div className="mt-1.5" style={{ fontSize: 12, color: T.ink2 }}>
                          Impact <b style={{ color: T.ink }}>{v.impact}</b> = {imp.w} points × {v.count} occurrences
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {bucket === "review" && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4">
            <SectionTitle sub="Anything uncertain belongs here. A check that guesses and gets it wrong teaches people to stop reading the report — which costs more than the finding was worth.">
              Needs review
            </SectionTitle>
          </div>
          {A11Y_REVIEW.map((r) => (
            <div key={r.id} className="px-5 py-4" style={{ borderTop: `1px solid ${T.line}` }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{r.id}</span>
                <Pill>WCAG {r.wcag}</Pill>
                <span className="font-mono" style={{ fontSize: 11.5, color: T.ink3 }}>{r.element}</span>
              </div>
              <div className="mt-1.5" style={{ fontSize: 12.5, color: T.ink }}>{r.what}</div>
              <div className="mt-1" style={{ fontSize: 12, color: T.ink2, lineHeight: 1.5 }}>{r.why}</div>
            </div>
          ))}
        </Card>
      )}

      {bucket === "notchecked" && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4">
            <SectionTitle sub="Computed from the rules that actually returned results on this run — not a fixed disclaimer.">
              What was not examined
            </SectionTitle>
          </div>
          {A11Y_NOT_CHECKED.map((n) => (
            <div key={n.area} className="px-5 py-3.5 flex items-start gap-3" style={{ borderTop: `1px solid ${T.line}` }}>
              <Pill fg={n.reason === "not-built" ? T.almost : T.ink2} bg={n.reason === "not-built" ? T.almostBg : T.muteBg}>{n.reason}</Pill>
              <div className="min-w-0">
                <div style={{ fontSize: 13, fontWeight: 600 }}>{n.area}</div>
                <div className="mt-1" style={{ fontSize: 12, color: T.ink2, lineHeight: 1.55 }}>{n.why}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {bucket === "reading" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="px-5 py-4">
              <SectionTitle sub="Linearised from the accessibility tree via CDP. This shows the order; it does not judge whether it is the right one.">
                Reading order
              </SectionTitle>
            </div>
            {READING_ORDER.map((r, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center gap-3" style={{ borderTop: `1px solid ${T.line}` }}>
                <span className="font-mono" style={{ fontSize: 11, color: T.ink3, width: 20 }}>{i + 1}</span>
                <Pill>{r.role}{r.level ? ` ${r.level}` : ""}</Pill>
                <span className="truncate flex-1" style={{ fontSize: 12.5, color: T.ink }}>{r.text}</span>
                {r.warn && <Pill fg={T.almost} bg={T.almostBg}>{r.warn}</Pill>}
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <Label>Keyboard capture</Label>
            <p className="mt-2" style={{ fontSize: 12, color: T.ink2, lineHeight: 1.55 }}>
              Tab is pressed for real in the page, before the state probe runs.
            </p>
            <div className="mt-3 space-y-1">
              <Row k="Focusable elements" v="67" />
              <Row k="Reached by Tab" v="33" />
              <Row k="Focus traps" v="0" />
              <Row k="Unreachable controls" v="2" />
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
              <Pill fg={T.almost} bg={T.almostBg}>capture hit its press limit</Pill>
              <p className="mt-2" style={{ fontSize: 11, color: T.ink3, lineHeight: 1.5 }}>
                Nothing past element 33 was measured. That is an unfinished measurement, not a pass.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — INSPECTOR (DevLens)
   ═══════════════════════════════════════════════════════════════════════════ */

/* DevLens derives the ratio badge rather than storing it — a stored label would
   keep claiming 16:9 after you dragged the frame to 1600×1000. Snap to the
   nearest named ratio within 0.5%, otherwise report N.NN:1 as unnamed. */
const NAMED_RATIOS = [
  ["1:1", 1], ["4:3", 4 / 3], ["3:2", 3 / 2], ["16:10", 16 / 10],
  ["16:9", 16 / 9], ["19.5:9", 19.5 / 9], ["20:9", 20 / 9],
];
function describeAspect(w, h) {
  const long = Math.max(w, h), short = Math.min(w, h);
  const r = long / short;
  for (const [label, value] of NAMED_RATIOS) {
    if (Math.abs(r - value) / value <= 0.005) {
      return { label: w >= h ? label : label.split(":").reverse().join(":"), named: true };
    }
  }
  return { label: `${r.toFixed(2)}:1`, named: false };
}

/* One frame's chrome bar. Typed dimensions commit to the same width/height the
   drag handles and the emulation read, so nothing downstream has to know which
   path changed them. Digits only, capped in the handler rather than by
   maxlength — the native attribute discards keystrokes before any event fires,
   which makes a four-digit desktop width silently uneditable. */
function FrameChrome({ d, dims, onDims, onRotate, locked, onLock, compact }) {
  const aspect = describeAspect(dims.w, dims.h);
  const engineTone = d.engine === "chromium" ? T.accent : d.engine === "webkit" ? T.pass : T.almost;

  const numField = (axis) => (
    <input
      value={dims[axis]}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
        onDims({ ...dims, [axis]: digits === "" ? "" : Number(digits) });
      }}
      inputMode="numeric"
      className="bg-transparent outline-none text-center font-mono"
      style={{ width: 34, fontSize: 10.5, color: T.ink, borderRadius: 5, backgroundColor: T.muteBg, padding: "1px 2px" }}
    />
  );

  return (
    <div className="flex items-center gap-1.5 mb-1.5" style={{ minHeight: 22 }}>
      <span className="shrink-0" style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: engineTone }} />
      <span className="truncate" style={{ fontSize: 11, fontWeight: 600 }}>{d.label}</span>
      {!compact && (
        <span className="ml-auto flex items-center gap-1">
          {numField("w")}
          <span style={{ fontSize: 9.5, color: T.ink3 }}>×</span>
          {numField("h")}
          <button onClick={() => onDims({ w: dims.h, h: dims.w })} title="Swap width and height"
            className="flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: T.muteBg }}>
            <span style={{ fontSize: 10, color: T.ink2 }}>⇄</span>
          </button>
          <button onClick={onLock} title={locked ? "Ratio locked" : "Ratio free"}
            className="flex items-center justify-center"
            style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: locked ? T.ink : T.muteBg }}>
            <Lock size={9} color={locked ? T.onInk : T.ink3} />
          </button>
          <button onClick={onRotate} title="Rotate this viewport"
            className="flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: T.muteBg }}>
            <RotateCw size={9} color={T.ink2} />
          </button>
        </span>
      )}
      <span className={compact ? "ml-auto" : ""}>
        <Pill fg={aspect.named ? T.ink2 : T.almost} bg={aspect.named ? T.muteBg : T.almostBg}
          title={aspect.named ? "Matches a named ratio" : "Not a standard ratio"}>
          {aspect.label}
        </Pill>
      </span>
    </div>
  );
}

/* THE CANVAS.
   This is the product — the panels are accessories — so it gets the full
   content width and its own focus mode rather than living in a 300px strip. */
function ViewportCanvas({
  devices, dims, setDims, inspect, setInspect, zoom, setZoom, fit, setFit,
  locked, setLocked, full, onToggleFull, onRotateAll, ratio, setRatio,
}) {
  const scale = zoom / 100;
  return (
    <div className="flex flex-col" style={{ height: full ? "100%" : undefined }}>
      {/* toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-3" style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={() => setInspect(!inspect)} className="flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors"
          style={{ borderRadius: 999, fontSize: 12, backgroundColor: inspect ? T.ink : T.muteBg, color: inspect ? T.onInk : T.ink2 }}>
          <MousePointer2 size={13} /> Inspect
          <span className="font-mono" style={{ fontSize: 10, opacity: .6 }}>⌘I</span>
        </button>

        <button onClick={onRotateAll} className="flex items-center gap-1.5 px-3 py-1.5 font-medium"
          style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg, color: T.ink2 }}>
          <RotateCw size={13} /> Rotate all
        </button>

        <span className="flex items-center gap-1 p-1" style={{ borderRadius: 999, backgroundColor: T.muteBg }}>
          {["fit-all", "fit-width", "manual"].map((f) => (
            <button key={f} onClick={() => setFit(f)} className="px-2.5 py-1 font-medium transition-colors"
              style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: fit === f ? T.onInk : "transparent", color: fit === f ? T.ink : T.ink2, boxShadow: fit === f ? T.shadow : "none" }}>
              {f.replace("-", " ")}
            </button>
          ))}
        </span>

        <span className="flex items-center gap-2 px-3 py-1" style={{ borderRadius: 999, backgroundColor: T.muteBg }}>
          <input type="range" min={8} max={100} value={zoom}
            onChange={(e) => { setZoom(Number(e.target.value)); setFit("manual"); }}
            style={{ width: 84, accentColor: T.ink }} />
          <span className="font-mono" style={{ fontSize: 11, color: T.ink2, width: 30, textAlign: "right" }}>{zoom}%</span>
        </span>

        <span className="ml-auto flex items-center gap-2">
          <span style={{ fontSize: 11, color: T.ink3 }}>{devices.length} viewports</span>
          <button onClick={onToggleFull} title={full ? "Exit focus mode (Esc)" : "Focus mode — fill the window"}
            className="flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors"
            style={{ borderRadius: 999, fontSize: 12, backgroundColor: full ? T.ink : T.accentSoft, color: full ? T.onInk : T.accent }}>
            <Maximize2 size={13} /> {full ? "Exit focus" : "Focus"}
          </button>
        </span>
      </div>

      {/* frames */}
      <div className="flex-1 overflow-auto p-5" style={{ backgroundColor: T.canvas, minHeight: full ? 0 : 340 }}>
        {devices.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center" style={{ minHeight: 260 }}>
            <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: T.muteBg }}>
              <Monitor size={17} color={T.ink3} />
            </span>
            <div className="mt-3" style={{ fontSize: 13.5, fontWeight: 600 }}>No viewports selected</div>
            <p className="mt-1" style={{ fontSize: 12.5, color: T.ink2 }}>Pick devices from the matrix to start testing.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-5">
            {devices.map((d) => {
              const dim = dims[d.id];
              const px = Math.max(120, Math.round(dim.w * scale));
              const py = Math.round(dim.h * scale);
              return (
                <div key={d.id} style={{ width: px }}>
                  <FrameChrome
                    d={d} dims={dim} compact={px < 210}
                    onDims={(next) => setDims((p) => ({ ...p, [d.id]: next }))}
                    onRotate={() => setDims((p) => ({ ...p, [d.id]: { w: p[d.id].h, h: p[d.id].w } }))}
                    locked={!!locked[d.id]}
                    onLock={() => setLocked((p) => ({ ...p, [d.id]: !p[d.id] }))}
                  />
                  <div className="relative overflow-hidden dk-surface"
                    style={{ borderRadius: 10, height: py, boxShadow: `inset 0 0 0 1px ${T.line}, ${T.shadow}` }}>
                    <MockPage label="" tint={T.accent} drift={dim.w < 500 ? 3 : 0} />
                    {inspect && px > 180 && (
                      <div className="absolute" style={{ left: "6%", top: "44%", width: "48%", height: "12%", backgroundColor: "rgba(74,58,255,.16)", outline: `1px solid ${T.accent}`, borderRadius: 2 }} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap" style={{ fontSize: 10.5, color: T.ink3 }}>
                    <span>DPR {d.dpr}</span><span>·</span>
                    <span>{d.mobile ? "pointer: coarse" : "pointer: fine"}</span>
                    {dim.w < 500 && <><span>·</span><span>touch</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5">
          <Label>Ratio preset</Label>
          {RATIOS.map((r) => (
            <button key={r} onClick={() => setRatio(r)} className="px-2.5 py-1 font-medium transition-colors"
              style={{ borderRadius: 999, fontSize: 11, backgroundColor: ratio === r ? T.ink : T.muteBg, color: ratio === r ? T.onInk : T.ink2 }}>
              {r}
            </button>
          ))}
          <span className="ml-auto" style={{ fontSize: 10.5, color: T.ink3 }}>
            Applied literally as width:height — orientation has its own control
          </span>
        </div>
        <div className="flex items-start gap-2 px-4 pb-2.5">
          <Info size={12} color={T.ink3} className="shrink-0 mt-0.5" />
          <span style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            Width media queries are real — each frame genuinely is that many CSS pixels wide. DPR,
            <span className="font-mono"> pointer:</span> and touch are emulated per frame. Every
            viewport is Chromium; engine selection changes UA, Sec-CH-UA and the script branch, not
            text shaping.
          </span>
        </div>
      </div>
    </div>
  );
}

function InspectorTab() {
  const w = useWidth();
  const twoCol = w >= 1180;
  const [selected, setSelected] = useState(["chrome-desktop-16x10", "webkit-tablet", "webkit-mobile"]);
  const [inspect, setInspect] = useState(true);
  const [ratio, setRatio] = useState("Free");
  const [fit, setFit] = useState("fit-all");
  const [zoom, setZoom] = useState(26);
  const [full, setFull] = useState(false);
  const [locked, setLocked] = useState({});
  /* Per-frame dimensions live in state, so typed entry, rotate and swap all
     write the same two numbers the emulation and the ratio badge read. */
  const [dims, setDims] = useState(() =>
    Object.fromEntries(DEVICES.map((d) => [d.id, { w: d.w, h: d.h }]))
  );

  /* Focus mode is a mode, not a page — Esc leaves it, like the frozen element. */
  useEffect(() => {
    if (!full) return;
    const onKey = (e) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const rotateAll = () =>
    setDims((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { w: v.h, h: v.w }])));
  const [sync, setSync] = useState({ enabled: true, scroll: true, click: true, hover: true, input: true, scrollMode: "ratio" });
  const [flags, setFlags] = useState({ noHas: false, noContainerQueries: true, noSubgrid: false, noBackdropFilter: false, noAspectRatio: false, nativeScrollbars: true });
  const [group, setGroup] = useState("spacing");
  const [cleanOnly, setCleanOnly] = useState(true);

  const active = DEVICES.filter((d) => selected.includes(d.id));
  const styleGroup = STYLE_GROUPS.find((g) => g.name === group);
  const decls = cleanOnly ? styleGroup.decls.filter((d) => d.authored) : styleGroup.decls;

  const canvasProps = {
    devices: active, dims, setDims, inspect, setInspect, zoom, setZoom, fit, setFit,
    locked, setLocked, onRotateAll: rotateAll, ratio, setRatio,
  };

  return (
    <div className="space-y-5">
      {/* ── FOCUS MODE ── the canvas fills the window; Esc returns ── */}
      {full && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: T.bg }}>
          <div className="flex-1 min-h-0 m-3 overflow-hidden dk-surface" style={{ borderRadius: 18, boxShadow: T.shadowLift }}>
            <ViewportCanvas {...canvasProps} full onToggleFull={() => setFull(false)} />
          </div>
        </div>
      )}

      {/* ── THE CANVAS ── full content width, first thing on the tab ── */}
      <Card className="overflow-hidden">
        <div className="px-4 pt-4">
          <SectionTitle sub="One URL across many viewports at once, with interaction mirrored between them">
            Viewport canvas
          </SectionTitle>
        </div>
        <ViewportCanvas {...canvasProps} full={false} onToggleFull={() => setFull(true)} />
      </Card>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: twoCol ? "minmax(0,1fr) 336px" : "minmax(0,1fr)" }}>
      <div className="min-w-0 space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Box model */}
          <Card className="p-5">
            <SectionTitle sub="Frozen element · .hero__stack">Box model</SectionTitle>
            <div className="p-4" style={{ borderRadius: 14, backgroundColor: T.sunken }}>
              <div className="relative" style={{ padding: 22, borderRadius: 8, backgroundColor: T.bmMargin }}>
                <span className="absolute" style={{ top: 4, left: 8, fontSize: 9.5, color: T.bmMarginFg }}>margin 0</span>
                <div className="relative" style={{ padding: 18, borderRadius: 6, backgroundColor: T.bmBorder }}>
                  <span className="absolute" style={{ top: 3, left: 6, fontSize: 9.5, color: T.bmMarginFg }}>border 0</span>
                  <div className="relative" style={{ padding: 20, borderRadius: 4, backgroundColor: T.bmPadding }}>
                    <span className="absolute" style={{ top: 3, left: 6, fontSize: 9.5, color: T.bmPaddingFg }}>padding 24</span>
                    <div className="flex items-center justify-center" style={{ borderRadius: 3, backgroundColor: T.bmContent, height: 48 }}>
                      <span className="font-mono" style={{ fontSize: 11, color: T.bmContentFg }}>620 × 104</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-0.5">
              <Row k="Cross-viewport identity" v="matched in 3 of 3" />
              <Row k="Selector" v=".hero__stack" mono />
            </div>
          </Card>

          {/* Cleaned CSS */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle sub="Diffed against the UA default for this tag">Computed styles</SectionTitle>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {STYLE_GROUPS.map((g) => (
                <button key={g.name} onClick={() => setGroup(g.name)} className="px-2.5 py-1 font-medium transition-colors"
                  style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: group === g.name ? T.ink : T.muteBg, color: group === g.name ? T.onInk : T.ink2 }}>{g.label}</button>
              ))}
            </div>
            <div className="p-3.5" style={{ borderRadius: 12, backgroundColor: T.sunken, minHeight: 132 }}>
              {decls.length === 0 ? (
                <div style={{ fontSize: 12, color: T.ink3 }}>Nothing authored in this group — every value is the UA default.</div>
              ) : decls.map((d) => (
                <div key={d.p} className="flex items-baseline gap-2 font-mono" style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <span style={{ color: d.authored ? T.accent : T.ink3 }}>{d.p}:</span>
                  <span style={{ color: d.authored ? T.ink : T.ink3 }}>{d.v};</span>
                  {!d.authored && <Pill>UA default</Pill>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <Toggle on={cleanOnly} onChange={setCleanOnly} label="Authored values only" />
            </div>
            <CopyButton label="Copy CSS" />
          </Card>
        </div>
      </div>

      <aside className={twoCol ? "sticky self-start space-y-4" : "space-y-4"} style={twoCol ? { top: 20 } : undefined}>
        <Card lift className="p-5">
          <Label>Load URL</Label>
          <div className="mt-2"><Field icon={Link2} value="https://staging.acme.com/pricing" onChange={() => {}} mono /></div>
          <div className="flex items-center gap-2 mt-3">
            <button className="flex-1 py-2.5 font-semibold" style={{ borderRadius: 999, backgroundColor: T.accent, color: T.onInk, fontSize: 13 }}>Load</button>
            <button className="px-3 py-2.5" style={{ borderRadius: 999, backgroundColor: T.muteBg }}><RotateCw size={14} color={T.ink2} /></button>
          </div>
          <p className="mt-2.5 flex items-start gap-1.5" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            <Lock size={11} className="shrink-0 mt-0.5" />
            The web build proxies through localhost and strips X-Frame-Options and CSP frame-ancestors, so sites that block framing still load.
          </p>
        </Card>

        <Card className="p-5">
          <Label>Device matrix</Label>
          <div className="mt-3 space-y-1">
            {DEVICES.map((d) => {
              const on = selected.includes(d.id);
              return (
                <button key={d.id} onClick={() => setSelected(on ? selected.filter((x) => x !== d.id) : [...selected, d.id])}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors"
                  style={{ borderRadius: 10, backgroundColor: on ? T.muteBg : "transparent" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: d.engine === "chromium" ? T.accent : d.engine === "webkit" ? T.pass : T.almost }} />
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 12.5, fontWeight: on ? 600 : 400, color: T.ink }}>{d.label}</span>
                  <span className="font-mono shrink-0" style={{ fontSize: 10.5, color: T.ink3 }}>{d.w}</span>
                  {on && <Check size={12} color={T.ink} />}
                </button>
              );
            })}
          </div>
          <button className="w-full mt-3 py-2 font-medium" style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>
            Custom matrix builder
          </button>
          <p className="mt-2.5" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            Every viewport is Chromium. Engine selection gives you the real UA, Sec-CH-UA and script branch — not Gecko or WebKit text shaping. For release sign-off you still need real browsers.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Label>Interaction sync</Label>
            <Pill fg={sync.enabled ? T.pass : T.ink3} bg={sync.enabled ? T.passBg : T.muteBg}>{sync.enabled ? "on" : "off"}</Pill>
          </div>
          <div className="mt-1">
            {["scroll", "click", "hover", "input"].map((k) => (
              <Toggle key={k} on={sync[k]} onChange={(v) => setSync({ ...sync, [k]: v })} label={`Mirror ${k}`} />
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 mt-2" style={{ borderRadius: 999, backgroundColor: T.muteBg }}>
            {["ratio", "absolute"].map((m) => (
              <button key={m} onClick={() => setSync({ ...sync, scrollMode: m })} className="flex-1 py-1.5 font-medium capitalize transition-colors"
                style={{ borderRadius: 999, fontSize: 11.5, backgroundColor: sync.scrollMode === m ? T.onInk : "transparent", color: sync.scrollMode === m ? T.ink : T.ink2, boxShadow: sync.scrollMode === m ? T.shadow : "none" }}>{m}</button>
            ))}
          </div>
          <p className="mt-2" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            Ratio survives differing page heights; absolute mirrors raw pixels.
          </p>
        </Card>

        <Card className="p-5">
          <Label>Feature simulation</Label>
          <div className="mt-1">
            {FEATURE_FLAGS.map((f) => (
              <Toggle key={f.id} on={flags[f.id]} onChange={(v) => setFlags({ ...flags, [f.id]: v })} label={f.label} sub={f.sub} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Label>Keyboard</Label>
          <div className="mt-2.5 space-y-1.5">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="font-mono shrink-0" style={{ fontSize: 11, color: T.ink, backgroundColor: T.muteBg, padding: "2px 6px", borderRadius: 6 }}>{k}</span>
                <span className="text-right" style={{ fontSize: 11.5, color: T.ink2 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </aside>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — METRICS
   ═══════════════════════════════════════════════════════════════════════════ */

function LineChart({ series, height = 150 }) {
  const all = series.flatMap((s) => s.data);
  const min = Math.min(...all) - 5, max = Math.max(...all) + 5;
  const n = series[0].data.length;
  const x = (i) => (i / (n - 1)) * 100;
  const y = (v) => 100 - ((v - min) / (max - min)) * 100;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {[0, 25, 50, 75, 100].map((g) => <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="#F0F0F2" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />)}
      {series.map((s) => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke"
          strokeLinejoin="round" strokeLinecap="round" points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      ))}
      {series.map((s) => s.data.map((v, i) => (
        <circle key={s.name + i} cx={x(i)} cy={y(v)} r="1.1" fill={s.color} vectorEffect="non-scaling-stroke" />
      )))}
    </svg>
  );
}

function MetricsTab() {
  const runs = [...RUNS].reverse();
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <SectionTitle sub="Every run of this target — same dev URL, same Figma node, same viewport set">
            Score over time
          </SectionTitle>
          <div className="flex gap-4 mb-3">
            {[
              { n: "Fidelity", c: T.ink }, { n: "Accessibility", c: T.fix }, { n: "Coverage", c: T.accent },
            ].map((s) => (
              <span key={s.n} className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: T.ink2 }}>
                <span style={{ width: 8, height: 2, borderRadius: 999, backgroundColor: s.c }} />{s.n}
              </span>
            ))}
          </div>
          <LineChart series={[
            { name: "fidelity", color: T.ink, data: runs.map((r) => r.score) },
            { name: "a11y", color: T.fix, data: runs.map((r) => r.a11y) },
            { name: "coverage", color: T.accent, data: runs.map((r) => r.coverage) },
          ]} />
          <div className="flex justify-between mt-2" style={{ fontSize: 10.5, color: T.ink3 }}>
            {runs.map((r) => <span key={r.n}>#{r.n}</span>)}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Phantom DEFAULT_WEIGHTS — categories with nothing to check score null and are excluded from the average">
            Category weights
          </SectionTitle>
          <div className="space-y-1.5 mt-1">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <span className="flex-1 truncate" style={{ fontSize: 12, color: c.score == null ? T.ink3 : T.ink2 }}>{c.label}</span>
                <div style={{ width: 60, height: 4, borderRadius: 999, backgroundColor: T.track }}>
                  <div style={{ width: `${c.weight * 500}%`, maxWidth: "100%", height: 4, borderRadius: 999, backgroundColor: c.score == null ? T.tick : T.ink }} />
                </div>
                <span className="font-mono" style={{ fontSize: 11, color: T.ink3, width: 32, textAlign: "right" }}>{c.weight.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4">
            <SectionTitle sub="Screenshots are stripped before writing — history answers whether the numbers moved, which needs the findings, not the pictures">
              Run history
            </SectionTitle>
          </div>
          <div className="px-5 py-2 grid items-center gap-3" style={{ gridTemplateColumns: "48px 1fr repeat(5, 62px)", backgroundColor: T.sunken2, borderTop: `1px solid ${T.line}` }}>
            {["Run", "When", "Score", "Fixed", "New", "Time", "Figma"].map((h) => (
              <Label key={h} className={h === "Run" || h === "When" ? "" : "text-right"}>{h}</Label>
            ))}
          </div>
          {RUNS.map((r) => (
            <div key={r.n} className="px-5 py-3 grid items-center gap-3" style={{ gridTemplateColumns: "48px 1fr repeat(5, 62px)", borderTop: `1px solid ${T.line}`, fontSize: 12 }}>
              <span className="font-mono" style={{ fontWeight: 600 }}>#{r.n}</span>
              <span style={{ color: T.ink2 }}>{r.at}</span>
              <span className="text-right" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.score}</span>
              <span className="text-right" style={{ color: T.pass, fontWeight: 600 }}>{r.fixed}</span>
              <span className="text-right" style={{ color: T.fix, fontWeight: 600 }}>{r.introduced}</span>
              <span className="text-right font-mono" style={{ color: T.ink3 }}>{r.duration}s</span>
              <span className="text-right">
                <Pill fg={r.figma === "network" ? T.almost : T.ink2} bg={r.figma === "network" ? T.almostBg : T.muteBg}>{r.figma}</Pill>
              </span>
            </div>
          ))}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub="Every other number depends on this, so it is reported alongside them">Mapping quality</SectionTitle>
            <div className="space-y-0.5">
              <Row k="Verdict" v="reliable" />
              <Row k="Comparable layers" v="161" />
              <Row k="High confidence (90+)" v="118" />
              <Row k="Needs review (60–74)" v="7" />
              <Row k="Unmatched (<60)" v="19" />
              <Row k="Coverage" v="88%" />
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
              <Pill fg={T.pass} bg={T.passBg}>frame 1440 = viewport 1440</Pill>
              <p className="mt-2" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
                No viewport mismatch. A 1440 design compared at 375 is uniformly scaled, not reported as 1000px of drift.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle sub="A re-scan after a code fix should cost no Figma quota">Figma quota</SectionTitle>
            <div className="space-y-0.5">
              <Row k="Requests this week" v="4" />
              <Row k="Served from disk cache" v="9 runs" />
              <Row k="Served from memory" v="3 runs" />
              <Row k="Cooldown" v="none" />
            </div>
            <button className="w-full mt-3 py-2 font-medium" style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>
              Clear cooldown
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB — SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */

function SettingsTab() {
  const [tol, setTol] = useState({ layoutPx: 2, typographyPx: 1, colorDeltaE: 2, radiusPx: 1, spacingPx: 2, positionPx: 4 });
  const [probe, setProbe] = useState(false);
  const [gates, setGates] = useState({ localFiles: false, privateTargets: false });
  const [token, setToken] = useState("figd_••••••••••••••••••••••••");

  const TOL_ROWS = [
    { k: "layoutPx", label: "Layout & sizing", unit: "px", max: 8, why: "A difference at or under this is a pass" },
    { k: "spacingPx", label: "Spacing & gap", unit: "px", max: 8, why: "Auto-layout item spacing against flex gap" },
    { k: "typographyPx", label: "Typography", unit: "px", max: 4, why: "Font size and line height" },
    { k: "colorDeltaE", label: "Colour", unit: "ΔE", max: 10, why: "CIE76 perceptual distance, not hex equality" },
    { k: "radiusPx", label: "Corner radius", unit: "px", max: 4, why: "Compared per corner, not as a shorthand" },
    { k: "positionPx", label: "Position", unit: "px", max: 12, why: "Document-relative offset" },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-5">
        <Card className="p-5">
          <SectionTitle sub="Every threshold in one place. These are hard numbers used by deterministic arithmetic — no model is asked whether 24px equals 24px.">
            Tolerances
          </SectionTitle>
          <div className="space-y-4">
            {TOL_ROWS.map((r) => (
              <div key={r.k}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: T.ink }}>{r.label}</span>
                    <span className="block" style={{ fontSize: 11, color: T.ink3 }}>{r.why}</span>
                  </div>
                  <span className="font-mono shrink-0" style={{ fontSize: 12.5, fontWeight: 700 }}>
                    ±{tol[r.k]}{r.unit === "px" ? "px" : ` ${r.unit}`}
                  </span>
                </div>
                <input type="range" min={0} max={r.max} step={r.unit === "ΔE" ? 0.5 : 1} value={tol[r.k]}
                  onChange={(e) => setTol({ ...tol, [r.k]: Number(e.target.value) })}
                  className="w-full" style={{ accentColor: T.ink }} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Rules that stop a known-irrelevant difference from reappearing on every scan">Ignore rules</SectionTitle>
          {[
            { kind: "dom-selector", target: ".cookie-banner", ignore: "subtree" },
            { kind: "figma-node", target: "214:96 · Badge / Popular", ignore: "text" },
            { kind: "dom-selector", target: "[data-testid]", ignore: "dimensions, color" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 mt-2" style={{ borderRadius: 12, backgroundColor: T.sunken }}>
              <Pill fg={r.kind === "figma-node" ? T.accent : T.ink2} bg={r.kind === "figma-node" ? T.accentSoft : T.muteBg}>{r.kind}</Pill>
              <span className="font-mono truncate flex-1" style={{ fontSize: 12 }}>{r.target}</span>
              <span style={{ fontSize: 11.5, color: T.ink3 }}>ignore {r.ignore}</span>
              <button><X size={13} color={T.ink3} /></button>
            </div>
          ))}
          <button className="w-full mt-3 py-2 font-medium" style={{ borderRadius: 999, fontSize: 12, backgroundColor: T.muteBg }}>Add rule</button>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="12 active, 1 stale. A stale acceptance is one whose design premise has since changed — it still counts against the score, because that decision was never actually made.">
            Accepted deviations
          </SectionTitle>
          {[
            { el: ".features .chip", prop: "height", reason: "44px tap target — WCAG 2.5.8", author: "Marta Ilagan", state: "active", premise: "40px" },
            { el: ".hero .btn-primary", prop: "border-radius", reason: "Matches the design system button, not this frame", author: "Dev Ocampo", state: "stale", premise: "8px → design now says 12px" },
            { el: ".plan__price", prop: "content", reason: "Live copy runs longer than the mock", author: "Marta Ilagan", state: "active", premise: "$29/mo" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 px-3.5 py-3 mt-2" style={{ borderRadius: 12, backgroundColor: s.state === "stale" ? T.almostBg : T.sunken }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>{s.prop}</span>
                  <span className="font-mono truncate" style={{ fontSize: 11.5, color: T.ink3 }}>{s.el}</span>
                  {s.state === "stale" && <Pill fg={T.almost} bg={T.onInk}>premise changed</Pill>}
                </div>
                <div className="mt-1" style={{ fontSize: 12, color: T.ink2 }}>{s.reason}</div>
                <div className="mt-0.5" style={{ fontSize: 11, color: T.ink3 }}>{s.author} · premise was {s.premise}</div>
              </div>
              <button className="shrink-0 px-3 py-1.5 font-medium dk-surface" style={{ borderRadius: 999, fontSize: 11.5 }}>
                {s.state === "stale" ? "Review" : "Revoke"}
              </button>
            </div>
          ))}
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <Label>Figma access</Label>
          <div className="mt-2.5"><Field icon={Lock} value={token} onChange={setToken} mono type="password" /></div>
          <p className="mt-2" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            The token lives in this browser, is posted per scan, and is forwarded straight to Figma. Nothing persists it server-side. Scopes needed: file_content:read, file_metadata:read.
          </p>
          <div className="mt-3 pt-3 space-y-0.5" style={{ borderTop: `1px solid ${T.line}` }}>
            <Row k="Spec cache" v="disk" />
            <Row k="Image cache" v="memory" />
          </div>
        </Card>

        <Card className="p-5">
          <Label>Scan behaviour</Label>
          <div className="mt-1">
            <Toggle on={probe} onChange={setProbe} label="Interaction & state QA"
              sub="Measures each element at rest, hover and focus. Off by default — roughly 400ms per element." />
          </div>
          <p className="mt-2" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
            When on, a hover state the design defines but the build never produces is reported, as is a missing focus indicator. It does not assert that a hover state matches the Figma hover variant — presence is checkable, equivalence is not.
          </p>
        </Card>

        <Card className="p-5">
          <Label>Security gates</Label>
          <p className="mt-2" style={{ fontSize: 11, color: T.ink2, lineHeight: 1.5 }}>
            Both are off by default. On a shared deployment they would let anyone who finds the URL read files off the host or reach hosts inside the network.
          </p>
          <div className="mt-2">
            <Toggle on={gates.localFiles} onChange={(v) => setGates({ ...gates, localFiles: v })}
              label="Allow file:// targets" sub="PHANTOM_ALLOW_LOCAL_FILES" />
            <Toggle on={gates.privateTargets} onChange={(v) => setGates({ ...gates, privateTargets: v })}
              label="Allow localhost & LAN" sub="PHANTOM_ALLOW_PRIVATE_TARGETS" />
          </div>
          <div className="mt-3 pt-3 flex items-start gap-2" style={{ borderTop: `1px solid ${T.line}` }}>
            <ShieldCheck size={12} color={T.pass} className="shrink-0 mt-0.5" />
            <span style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.5 }}>
              SSRF guard is always on. Neither gate can be turned on by anything arriving in a request — it is an operator decision, taken at boot.
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <Label>Default viewports</Label>
          <div className="mt-2.5 space-y-2">
            {VIEWPORTS.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.id} className="flex items-center gap-2.5 px-3 py-2" style={{ borderRadius: 10, backgroundColor: T.muteBg }}>
                  <Icon size={14} color={T.ink2} />
                  <span className="flex-1" style={{ fontSize: 12.5, fontWeight: 500 }}>{v.name}</span>
                  <span className="font-mono" style={{ fontSize: 11.5, color: T.ink3 }}>{v.w}×{v.h}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHELL
   ═══════════════════════════════════════════════════════════════════════════ */

const TITLES = {
  overview: { t: "Overview", s: "Pricing · Plan cards — run #14, 18 minutes ago" },
  scan: { t: "DQA Scan", s: "The Figma frame is the specification; the live site is the implementation under test" },
  a11y: { t: "Accessibility", s: "What failed, what a person still has to judge, and what was never examined" },
  inspector: { t: "Inspector", s: "One URL across many viewports at once, with a hover inspector and interaction mirroring" },
  metrics: { t: "Metrics", s: "How this target has moved across 14 runs" },
  settings: { t: "Settings", s: "Thresholds, credentials, and the decisions the engine is not allowed to make for you" },
};

export default function DikyaDQA() {
  const [tab, setTab] = useState("overview");
  const [theme, setTheme] = useState("light");
  const [q, setQ] = useState("");
  const w = useWidth();
  const rail = w < 1000;
  const meta = TITLES[tab];

  /* Swap the tokens before any child reads them. Nothing is memoised in this
     tree, so a root re-render re-runs every child with the new values — no
     remount, so the open tab, filters and expanded rows all survive. */
  applyTheme(theme);
  const dark = theme === "dark";

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", color: T.ink, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <style>{`
        ::-webkit-scrollbar { height: 0; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.thumb}; border-radius: 999px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input::placeholder { color: ${T.ink3}; }
        input[type="range"] { height: 4px; }
        .dk-surface { background-color: ${T.card}; }
        .dk-hover:hover { background-color: ${T.hoverRow}; }
        .dk-hover-soft:hover { background-color: ${T.hoverSoft}; }
        ::selection { background: ${T.accentSoft}; color: ${T.accent}; }
      `}</style>

      <div className="flex">
        {/* ── LEFT SIDEBAR — collapses to an icon rail, never disappears ── */}
        <aside className="flex flex-col shrink-0 sticky top-0"
          style={{ width: rail ? 64 : 248, height: "100vh", backgroundColor: T.nav, borderRight: `1px solid ${T.line}`, transition: "width .18s" }}>
          <div className={`flex items-center gap-2.5 ${rail ? "justify-center px-0" : "px-5"}`} style={{ height: 64 }}>
            <span className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: T.ink }}>
              <Crosshair size={15} color={T.onInk} />
            </span>
            {!rail && <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.025em" }}>Dikya</span>}
          </div>

          <nav className={`flex-1 overflow-y-auto pb-4 ${rail ? "px-2" : "px-3"}`}>
            {NAV.map((sec, si) => (
              <div key={si} className={si === 0 ? "" : "mt-5"}>
                {sec.group && !rail && <div className="px-3 mb-1.5"><Label>{sec.group}</Label></div>}
                {sec.group && rail && <div className="mx-3 mb-2" style={{ height: 1, backgroundColor: T.line }} />}
                {sec.items.map((it) => {
                  const Icon = it.icon, on = tab === it.id;
                  return (
                    <button key={it.id} onClick={() => setTab(it.id)} title={rail ? it.label : undefined}
                      className={`w-full flex items-center gap-3 mb-0.5 transition-colors ${rail ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}
                      style={{ borderRadius: 11, backgroundColor: on ? T.accentSoft : "transparent", color: on ? T.accent : T.ink2, position: "relative" }}>
                      <Icon size={17} strokeWidth={on ? 2.2 : 1.8} />
                      {!rail && <span className="flex-1 text-left" style={{ fontSize: 13.5, fontWeight: on ? 600 : 500 }}>{it.label}</span>}
                      {it.badge && !rail && (
                        <span className="flex items-center justify-center font-semibold"
                          style={{ minWidth: 20, height: 18, padding: "0 6px", borderRadius: 999, fontSize: 10.5, backgroundColor: on ? T.onInk : T.muteBg, color: on ? T.accent : T.ink2 }}>
                          {it.badge}
                        </span>
                      )}
                      {it.badge && rail && (
                        <span className="absolute" style={{ top: 6, right: 10, width: 6, height: 6, borderRadius: 999, backgroundColor: T.fix, outline: "2px solid #fff" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className={rail ? "px-2 pb-3" : "px-3 pb-3"}>
            {!rail && (
              <div className="px-3 py-2.5 mb-2" style={{ borderRadius: 12, backgroundColor: T.muteBg }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: T.pass }} />
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>Engine healthy</span>
                </div>
                <div className="mt-1" style={{ fontSize: 10.5, color: T.ink3, lineHeight: 1.45 }}>
                  Chromium pinned · 891 tests green
                </div>
              </div>
            )}
            <button title={rail ? "Marta Ilagan · Design QA" : undefined}
              className={`w-full flex items-center gap-2.5 py-2 dk-hover transition-colors ${rail ? "justify-center px-0" : "px-2"}`}
              style={{ borderRadius: 11 }}>
              <span className="flex items-center justify-center font-semibold shrink-0"
                style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: T.ink, color: T.onInk, fontSize: 11 }}>MI</span>
              {!rail && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>Marta Ilagan</span>
                    <span className="block truncate" style={{ fontSize: 11, color: T.ink3 }}>Design QA</span>
                  </span>
                  <ChevronDown size={14} color={T.ink3} />
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── CENTER CONTENT ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-4 px-6"
            style={{ height: 64, backgroundColor: dark ? "rgba(11,11,13,.82)" : "rgba(244,244,245,.85)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 px-3 flex-1" style={{ maxWidth: 380, height: 36, borderRadius: 999, backgroundColor: T.onInk, boxShadow: T.shadow }}>
              <Search size={14} color={T.ink3} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a target, finding or layer…"
                className="w-full bg-transparent outline-none" style={{ fontSize: 12.5 }} />
            </div>
            <div className="flex-1" />
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 dk-surface" style={{ borderRadius: 999, boxShadow: T.shadow, fontSize: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: T.pass }} />
              <span style={{ color: T.ink2 }}>staging.acme.com/pricing</span>
              <ChevronDown size={13} color={T.ink3} />
            </button>
            <button onClick={() => setTheme(dark ? "light" : "dark")}
              title={dark ? "Switch to light" : "Switch to dark"}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className="flex items-center justify-center dk-surface" style={{ width: 34, height: 34, borderRadius: 999, boxShadow: T.shadow }}>
              {dark ? <Sun size={15} color={T.ink2} /> : <Moon size={15} color={T.ink2} />}
            </button>
            <button className="flex items-center justify-center dk-surface" style={{ width: 34, height: 34, borderRadius: 999, boxShadow: T.shadow }}>
              <HelpCircle size={15} color={T.ink2} />
            </button>
            <button className="relative flex items-center justify-center dk-surface" style={{ width: 34, height: 34, borderRadius: 999, boxShadow: T.shadow }}>
              <Bell size={15} color={T.ink2} />
              <span className="absolute" style={{ top: 8, right: 9, width: 6, height: 6, borderRadius: 999, backgroundColor: T.fix, outline: "2px solid #fff" }} />
            </button>
          </header>

          <main className="px-6 pb-16" style={{ maxWidth: 1440 }}>
            <div className="pt-1 pb-5">
              <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1 }}>{meta.t}</h1>
              <p className="mt-1.5" style={{ fontSize: 13, color: T.ink2, maxWidth: 640 }}>{meta.s}</p>
            </div>

            {tab === "overview" && <OverviewTab go={setTab} />}
            {tab === "scan" && <ScanTab />}
            {tab === "a11y" && <AccessibilityTab />}
            {tab === "inspector" && <InspectorTab />}
            {tab === "metrics" && <MetricsTab />}
            {tab === "settings" && <SettingsTab />}
          </main>
        </div>
      </div>
    </div>
  );
}
