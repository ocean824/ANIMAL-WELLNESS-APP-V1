{
  "brand": {
    "name": "Soula Paws",
    "positioning": "Privacy-first Human–Animal Bond & Wellness OS (relationship intelligence, not a pet tracker)",
    "attributes": [
      "gentle",
      "trustworthy",
      "emotionally supportive",
      "premium wellness",
      "non-clinical",
      "non-gamified",
      "explainable",
      "safety-forward"
    ],
    "voice_and_tone": {
      "do": [
        "Use warm, validating language (e.g., ‘You’re not alone’, ‘Let’s take one small step’)",
        "Use consent-forward copy (‘You control what’s shared’)",
        "Use professional escalation language when risk is detected (‘Consider contacting a veterinarian today’)"
      ],
      "dont": [
        "Avoid gamified language (streaks, trophies, ‘level up’)",
        "Avoid clinical/diagnostic claims",
        "Avoid urgency panic copy unless safety escalation requires it"
      ]
    }
  },

  "design_personality": {
    "style_fusion": [
      "Calm/Headspace warmth (soft neutrals + generous whitespace)",
      "Swiss clarity for dashboards (grid discipline, typographic hierarchy)",
      "Soft card-based bento layout (dashboard modules)",
      "Subtle tactile texture (paper/noise overlays)"
    ],
    "layout_principles": {
      "reading_flow": "F-pattern for dashboards; Z-pattern for landing hero",
      "density": "Low density by default; progressive disclosure for advanced metrics",
      "surfaces": "Solid warm backgrounds; cards are opaque (no transparent reading surfaces)",
      "trust_signals": "Safety badges, confidence labels, consent callouts always visible near AI outputs"
    }
  },

  "typography": {
    "font_pairing": {
      "display": {
        "name": "EB Garamond",
        "usage": "Landing hero headline + key emotional headings (sparingly)"
      },
      "ui": {
        "name": "Figtree",
        "usage": "All UI, dashboards, forms, tables, badges"
      }
    },
    "implementation": {
      "google_fonts": [
        "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=Figtree:wght@400;500;600;700&display=swap"
      ],
      "tailwind_notes": "Set body font to Figtree; use EB Garamond only via utility class on specific headings (avoid overuse)."
    },
    "type_scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg text-muted-foreground",
      "section_title": "text-xl md:text-2xl font-semibold",
      "card_title": "text-sm font-semibold tracking-tight",
      "body": "text-sm md:text-base leading-relaxed",
      "caption": "text-xs text-muted-foreground"
    }
  },

  "color_system": {
    "notes": [
      "Warm, calming wellness aesthetic: soft neutrals + ocean-teal accents + muted clay for warmth.",
      "No purple for AI/chat.",
      "Gradients only as decorative section backgrounds (<=20% viewport)."
    ],
    "tokens_css": {
      "location": "/app/frontend/src/index.css",
      "add_or_replace": "Replace :root HSL tokens with the following (keep .dark optional but not default).",
      "css": ":root {\n  --background: 34 33% 97%; /* oat */\n  --foreground: 24 18% 12%; /* espresso */\n\n  --card: 0 0% 100%;\n  --card-foreground: 24 18% 12%;\n\n  --popover: 0 0% 100%;\n  --popover-foreground: 24 18% 12%;\n\n  --primary: 174 38% 28%; /* ocean-teal */\n  --primary-foreground: 0 0% 98%;\n\n  --secondary: 32 28% 92%; /* warm sand */\n  --secondary-foreground: 24 18% 14%;\n\n  --muted: 30 22% 94%;\n  --muted-foreground: 24 10% 38%;\n\n  --accent: 18 42% 86%; /* soft clay */\n  --accent-foreground: 24 18% 14%;\n\n  --destructive: 6 72% 52%;\n  --destructive-foreground: 0 0% 98%;\n\n  --border: 28 18% 86%;\n  --input: 28 18% 86%;\n  --ring: 174 38% 28%;\n\n  --radius: 0.75rem;\n\n  /* semantic extras (add as custom properties for app-specific UI) */\n  --success: 158 42% 32%;\n  --success-foreground: 0 0% 98%;\n  --warning: 34 78% 45%;\n  --warning-foreground: 24 18% 12%;\n  --info: 198 52% 38%;\n  --info-foreground: 0 0% 98%;\n\n  /* bond score palette */\n  --bond-low: 18 70% 52%;\n  --bond-mid: 34 78% 45%;\n  --bond-high: 158 42% 32%;\n\n  /* confidence */\n  --confidence-low: 24 10% 45%;\n  --confidence-med: 198 52% 38%;\n  --confidence-high: 174 38% 28%;\n\n  /* charts */\n  --chart-1: 174 38% 28%;\n  --chart-2: 198 52% 38%;\n  --chart-3: 34 78% 45%;\n  --chart-4: 18 42% 86%;\n  --chart-5: 28 18% 86%;\n }"
    },
    "allowed_gradients": {
      "rule": "Use only for hero/section backgrounds; never on text-heavy cards; never >20% viewport.",
      "examples": [
        "bg-[radial-gradient(1200px_circle_at_20%_10%,hsl(18_42%_90%)_0%,transparent_55%),radial-gradient(900px_circle_at_80%_0%,hsl(174_38%_90%)_0%,transparent_50%)]",
        "bg-[linear-gradient(135deg,hsl(34_33%_97%)_0%,hsl(32_28%_92%)_55%,hsl(34_33%_97%)_100%)]"
      ]
    },
    "texture": {
      "approach": "Add subtle noise overlay via CSS pseudo-element on large section wrappers.",
      "css_snippet": ".noise-overlay{position:relative;}\n.noise-overlay:before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.06;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>');mix-blend-mode:multiply;border-radius:inherit;}"
    }
  },

  "spacing_grid": {
    "container": "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
    "dashboard_grid": {
      "mobile": "grid grid-cols-1 gap-4",
      "md": "md:grid-cols-12 md:gap-6",
      "bento_rule": "Use md:col-span-4/6/8/12; keep primary metric top-left; avoid equal-weight cards everywhere."
    },
    "card_padding": "p-4 md:p-6",
    "section_spacing": "py-10 md:py-14"
  },

  "components": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui/",
      "use_components": [
        "button.jsx",
        "card.jsx",
        "badge.jsx",
        "tabs.jsx",
        "dialog.jsx",
        "sheet.jsx",
        "dropdown-menu.jsx",
        "navigation-menu.jsx",
        "input.jsx",
        "textarea.jsx",
        "slider.jsx",
        "select.jsx",
        "switch.jsx",
        "calendar.jsx",
        "table.jsx",
        "tooltip.jsx",
        "progress.jsx",
        "scroll-area.jsx",
        "separator.jsx",
        "sonner.jsx"
      ]
    },
    "buttons": {
      "style": "Luxury / Elegant (rounded 10–12px, gentle elevation)",
      "tokens": {
        "radius": "rounded-xl",
        "shadow": "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]",
        "motion": "transition-colors duration-200"
      },
      "variants": {
        "primary": "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary)/0.92)] focus-visible:ring-2 focus-visible:ring-ring",
        "secondary": "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary)/0.85)]",
        "ghost": "bg-transparent hover:bg-[hsl(var(--secondary)/0.7)]"
      },
      "interaction": {
        "press": "active:translate-y-[1px] active:shadow-none",
        "disabled": "disabled:opacity-50 disabled:pointer-events-none"
      }
    },
    "badges": {
      "safety_levels": {
        "safe": "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.25)]",
        "caution": "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]",
        "escalate": "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.25)]"
      },
      "confidence": {
        "low": "bg-[hsl(var(--confidence-low)/0.12)] text-[hsl(var(--confidence-low))]",
        "medium": "bg-[hsl(var(--confidence-med)/0.12)] text-[hsl(var(--confidence-med))]",
        "high": "bg-[hsl(var(--confidence-high)/0.12)] text-[hsl(var(--confidence-high))]"
      }
    },
    "forms": {
      "pattern": "Use shadcn Form + Label + Input + Textarea + Slider. Keep helper text always visible for sensitive inputs.",
      "sliders": {
        "use": "Daily Check-In (stress/connection 1–10), Wellness Logs (appetite/energy/sleep/anxiety)",
        "ticks": "Render 1, 5, 10 labels below slider for clarity; show current value in a small pill badge."
      }
    },
    "navigation": {
      "authenticated_shell": {
        "desktop": "Left sidebar (Sheet on mobile). Top bar includes search, notifications bell, profile menu.",
        "components": ["sheet.jsx", "navigation-menu.jsx", "dropdown-menu.jsx", "breadcrumb.jsx"],
        "sidebar_style": "bg-card border-r border-border rounded-none; section labels in text-xs uppercase tracking-wide text-muted-foreground"
      }
    },
    "cards": {
      "base": "bg-card text-card-foreground border border-border rounded-2xl",
      "hover": "hover:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)] transition-shadow duration-200",
      "no_transparency": "Do not use backdrop-blur cards for reading surfaces."
    },
    "tables": {
      "use": "Admin Users, Audit Logs, Agent Runs, Voice Tickets",
      "pattern": "Sticky header + row hover + right-aligned actions dropdown"
    },
    "toasts": {
      "library": "sonner",
      "component": "/app/frontend/src/components/ui/sonner.jsx",
      "usage": "Use for save confirmations, report generated, consent updated, escalation ticket created"
    }
  },

  "page_blueprints": {
    "landing": {
      "structure": [
        "Hero (emotional headline + privacy promise + primary CTA)",
        "Relationship Intelligence (explainable scoring preview)",
        "Safety & Guardrails (badges + escalation language)",
        "Feature Bento (Rituals, Check-ins, Reports, Care Circle)",
        "Testimonials (caregivers/foster/senior pet)",
        "FAQ (privacy, AI limitations, vet-ready reports)",
        "Final CTA + Footer (consent + contact)"
      ],
      "hero_visual": "Use a warm neutral photo + subtle radial background accents (<=20% viewport).",
      "cta": "Primary: ‘Start gently’ (register). Secondary: ‘See safety commitments’."
    },
    "auth_split_layout": {
      "layout": "Split screen on desktop: left brand panel (story + privacy bullets), right form card. On mobile: stacked with brand panel collapsed into top banner.",
      "brand_panel": [
        "Logo + short promise",
        "3 bullets: Privacy-first, Explainable bond scoring, Safety escalation",
        "Small testimonial quote"
      ],
      "forms": ["Login", "Register", "Forgot Password", "Reset Password"],
      "components": ["card.jsx", "input.jsx", "button.jsx", "separator.jsx"]
    },
    "dashboard": {
      "bento_layout": {
        "row1": [
          "Bond Score card (md:col-span-7)",
          "Today’s Ritual (md:col-span-5)"
        ],
        "row2": [
          "Pet Wellness Snapshot (md:col-span-4)",
          "Human Mood Snapshot (md:col-span-4)",
          "Daily Check-In panel (md:col-span-4)"
        ],
        "row3": [
          "AI Coach prompt panel (md:col-span-7)",
          "Care Circle activity (md:col-span-5)"
        ],
        "row4": [
          "Recent wellness logs (md:col-span-8)",
          "Reports ready (md:col-span-4)"
        ]
      }
    },
    "bond_score_page": {
      "visual": "Large score dial + trend chip + confidence badge + ‘Why this score?’ explainable factors.",
      "chart": "Recharts line chart with soft area fill (very light) and clear axes; no neon.",
      "explainability": "Use Accordion for factor breakdown; each factor shows direction (+/-), evidence, and suggested next action."
    },
    "relationship_intelligence_snapshot": {
      "layout": "5 dimension bars (connection, safety, routine, regulation, enrichment) + risks + next best actions.",
      "components": ["progress.jsx", "badge.jsx", "accordion.jsx"]
    },
    "ai_bond_coach_chat": {
      "layout": "Two-column on desktop: chat left, ‘Safety & Context’ right rail. On mobile: right rail becomes a collapsible Sheet.",
      "message_style": {
        "user": "bg-secondary text-secondary-foreground rounded-2xl px-4 py-3",
        "assistant": "bg-card border border-border rounded-2xl px-4 py-3"
      },
      "safety_ui": "Every assistant message includes Safety Level badge + Confidence badge + Disclaimer tooltip link.",
      "streaming": "Show typing indicator skeleton + subtle shimmer (no flashy dots)."
    },
    "voice_support": {
      "mic": "Large circular mic button with calm pulse ring when listening; fallback text input always visible.",
      "states": ["idle", "listening", "processing", "speaking", "error"],
      "escalation": "If risk detected, show Alert with professional language + ‘Create ticket’ CTA."
    },
    "agent_command_center": {
      "layout": "Grid of 14 agent cards with risk level badges + run button + approvals queue in a side panel.",
      "interaction": "Run requires confirmation dialog; approvals queue uses Tabs (Pending/Approved/Rejected)."
    },
    "privacy_and_consent": {
      "layout": "Consent dashboard with Switches + audit trail table + export/delete actions.",
      "copy": "Always explain what toggles do in plain language; include ‘Last updated’ timestamp."
    },
    "admin": {
      "tone": "Still warm, but more utilitarian; keep same tokens.",
      "pages": ["Metrics overview", "Users", "Audit Logs", "Agent Runs", "Voice Tickets", "Knowledge Base", "System Health"],
      "components": ["table.jsx", "tabs.jsx", "badge.jsx", "dropdown-menu.jsx"]
    }
  },

  "data_viz": {
    "library": "recharts",
    "bond_score": {
      "score_range": "0-100",
      "trend_chip": "Improving / Stable / Needs attention",
      "confidence": "Low / Medium / High",
      "color_logic": {
        "0-39": "--bond-low",
        "40-69": "--bond-mid",
        "70-100": "--bond-high"
      },
      "distinctive_visual": "Use a semi-donut gauge with a soft track + solid indicator; avoid neon gradients."
    },
    "empty_states": {
      "rule": "Never shame the user. Use supportive prompts (‘No logs yet—want to start with a 30-second check-in?’)."
    }
  },

  "motion": {
    "library": "framer-motion (recommended)",
    "install": {
      "command": "npm i framer-motion",
      "usage": "Use for page transitions, card entrance, mic pulse ring. Respect prefers-reduced-motion."
    },
    "principles": [
      "Duration 160–240ms for hover/focus; 280–420ms for page/section entrance",
      "Easing: cubic-bezier(0.2, 0.8, 0.2, 1)",
      "No universal transition: never transition: all"
    ],
    "micro_interactions": {
      "buttons": "Color transition + subtle shadow lift on hover; press translate-y 1px",
      "cards": "Shadow deepen on hover only (no scale)",
      "sidebar": "Active item has left accent bar + soft background",
      "chat": "New assistant message fades in + slight y translate (6px)"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and interactive elements",
      "Visible focus rings using --ring",
      "Support prefers-reduced-motion",
      "All form fields have labels + helper text",
      "Avoid color-only meaning: pair badges with text (e.g., ‘Confidence: High’)"
    ]
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
    "examples": [
      "data-testid=\"landing-primary-cta-button\"",
      "data-testid=\"auth-login-submit-button\"",
      "data-testid=\"dashboard-bond-score-card\"",
      "data-testid=\"bond-score-confidence-badge\"",
      "data-testid=\"chat-send-message-button\"",
      "data-testid=\"voice-support-mic-button\"",
      "data-testid=\"privacy-consent-toggle-ai-coach\""
    ]
  },

  "image_urls": {
    "hero": [
      {
        "url": "https://images.unsplash.com/photo-1606231108210-d9407465881f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHx3YXJtJTIwbmV1dHJhbCUyMHBldCUyMG93bmVyJTIwZG9nJTIwY296eSUyMGhvbWV8ZW58MHx8fG9yYW5nZXwxNzgzMzU3NTE5fDA&ixlib=rb-4.1.0&q=85",
        "category": "landing-hero",
        "description": "Warm, gentle pet photo for hero side (crop to 4:3, add soft overlay)."
      }
    ],
    "supporting": [
      {
        "url": "https://images.unsplash.com/photo-1606231106932-5eedf197cdcc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHx3YXJtJTIwbmV1dHJhbCUyMHBldCUyMG93bmVyJTIwZG9nJTIwY296eSUyMGhvbWV8ZW58MHx8fG9yYW5nZXwxNzgzMzU3NTE5fDA&ixlib=rb-4.1.0&q=85",
        "category": "landing-feature",
        "description": "Secondary pet image for feature section or testimonial backdrop (use sparingly)."
      }
    ],
    "textures": [
      {
        "url": "https://images.unsplash.com/photo-1596307312584-cc72d38b011f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxzb2Z0JTIwbmV1dHJhbCUyMGFic3RyYWN0JTIwdGV4dHVyZSUyMHBhcGVyJTIwZ3JhaW58ZW58MHx8fHRlYWx8MTc4MzM1NzUzM3ww&ixlib=rb-4.1.0&q=85",
        "category": "background-texture",
        "description": "Paper texture reference (prefer CSS noise overlay; use image only if needed)."
      }
    ]
  },

  "instructions_to_main_agent": {
    "global_css_cleanup": [
      "Remove/stop using /app/frontend/src/App.css default CRA styles (dark centered header). Do NOT add .App { text-align:center }.",
      "Update /app/frontend/src/index.css :root tokens to the warm neutral palette above.",
      "Set body font to Figtree; add EB Garamond utility class for hero headings only.",
      "Add .noise-overlay helper class for landing hero + auth brand panel backgrounds (not for cards)."
    ],
    "layout_implementation": [
      "Use a responsive authenticated shell: Sidebar (desktop) + Sheet (mobile) + Topbar.",
      "Dashboard uses bento grid with unequal spans; keep Bond Score top-left and largest.",
      "Chat page includes Safety & Context rail; on mobile it becomes a Sheet."
    ],
    "ai_safety_ui": [
      "Every AI output (chat, ritual generator, voice agent) must show Safety Level badge + Confidence badge + disclaimer link.",
      "Escalation language must be professional and calm; use Alert component for risk states."
    ],
    "data_testids": [
      "Add data-testid to all buttons, inputs, sliders, toggles, nav links, key cards, badges, and error banners.",
      "Use kebab-case describing role (not appearance)."
    ],
    "js_files_note": "All components/pages are .js (not .tsx). Keep examples and imports in JS."
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
