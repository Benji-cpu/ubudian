export const SITE_NAME = "The Ubudian";
export const SITE_DESCRIPTION =
  "Tantra, ceremonies, ecstatic dance, sound journeys, shadow work — Ubud's conscious community in one place.";
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.trim()) || "http://localhost:4000";

export const NAV_LINKS = [
  { label: "Quiz", href: "/quiz" },
  { label: "Guides", href: "/guides" },
  { label: "Events", href: "/events" },
  { label: "Ubud Retreats", href: "/experiences" },
  { label: "Humans of Ubud", href: "/stories" },
  { label: "Tours", href: "/tours" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Membership", href: "/membership" },
  { label: "About", href: "/about" },
] as const;

export type AdminNavItem =
  | { type: "link"; label: string; href: string; icon: string }
  | { type: "divider" };

export const ADMIN_NAV_LINKS: AdminNavItem[] = [
  { type: "link", label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { type: "link", label: "Events", href: "/admin/events", icon: "Calendar" },
  { type: "link", label: "Sources", href: "/admin/sources", icon: "Zap" },
  { type: "divider" },
  { type: "link", label: "Content", href: "/admin/content", icon: "FileText" },
  { type: "link", label: "Guides", href: "/admin/guides", icon: "BookOpen" },
  { type: "link", label: "Tours", href: "/admin/tours", icon: "MapPin" },
  { type: "link", label: "Commerce", href: "/admin/commerce", icon: "CreditCard" },
  { type: "link", label: "Community", href: "/admin/community", icon: "Users" },
  { type: "divider" },
  { type: "link", label: "Site Settings", href: "/admin/settings", icon: "Settings" },
];

export const ADMIN_GROUPED_ROUTES: Record<string, string[]> = {
  "/admin/content": ["/admin/blog", "/admin/stories", "/admin/newsletter"],
  "/admin/tours": [
    "/admin/tours",
    "/admin/experiences",
    "/admin/journeys",
    "/admin/practitioners",
    "/admin/partners",
  ],
  "/admin/commerce": ["/admin/bookings", "/admin/subscriptions"],
  "/admin/community": ["/admin/subscribers", "/admin/trusted-submitters", "/admin/feedback"],
  "/admin/sources": ["/admin/ingestion"],
};

export const EVENT_CATEGORIES = [
  "Dance & Movement",
  "Tantra & Intimacy",
  "Ceremony & Sound",
  "Yoga & Meditation",
  "Healing & Bodywork",
  "Circle & Community",
  "Music & Performance",
  "Art & Culture",
  "Retreat & Training",
  "Other",
] as const;

export const CONTENT_STATUS = ["draft", "published", "archived"] as const;
export const EVENT_STATUS = ["pending", "approved", "rejected", "archived"] as const;

export const STORY_THEME_TAGS = [
  "Healer",
  "Artist",
  "Entrepreneur",
  "Yogi",
  "Chef & Food",
  "Musician",
  "Writer",
  "Farmer",
  "Spiritual Guide",
  "Craftsperson",
  "Educator",
  "Environmentalist",
  "Expat Life",
  "Local Legend",
  "Digital Nomad",
  "Facilitator",
  "Space Holder",
  "Bodyworker",
  "Breathwork Guide",
  "Dance Facilitator",
  "Ceremonialist",
] as const;

export const DASHBOARD_NAV_LINKS = [
  { label: "Overview", href: "/dashboard" },
  { label: "My Spirit", href: "/dashboard/archetype" },
  { label: "My Agenda", href: "/dashboard/events" },
  { label: "My Retreats", href: "/dashboard/retreats" },
  { label: "Membership", href: "/dashboard/membership" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  "Dance & Movement": "💃",
  "Tantra & Intimacy": "🔥",
  "Ceremony & Sound": "🕯️",
  "Yoga & Meditation": "🧘",
  "Healing & Bodywork": "✨",
  "Circle & Community": "⭕",
  "Music & Performance": "🎵",
  "Art & Culture": "🎨",
  "Retreat & Training": "🏕️",
  "Other": "📌",
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  "Dance & Movement": "from-fuchsia-500 to-purple-700",
  "Tantra & Intimacy": "from-red-700 to-amber-900",
  "Ceremony & Sound": "from-violet-600 to-indigo-900",
  "Yoga & Meditation": "from-emerald-500 to-teal-700",
  "Healing & Bodywork": "from-amber-500 to-yellow-700",
  "Circle & Community": "from-orange-600 to-amber-800",
  "Music & Performance": "from-purple-600 to-indigo-800",
  "Art & Culture": "from-rose-500 to-pink-700",
  "Retreat & Training": "from-emerald-600 to-green-900",
  "Other": "from-gray-500 to-slate-700",
};

/**
 * Brand-toned gradients used by the event-card placeholder. Quieter than
 * CATEGORY_GRADIENTS (which still powers chips and small accents) — these
 * stay in the deep-green / terracotta / charcoal / gold palette so empty
 * cards sit alongside real imagery without screaming.
 */
export const CATEGORY_BRAND_GRADIENTS: Record<string, string> = {
  "Dance & Movement": "from-[#2C4A3E] via-[#3A5A4A] to-[#B85C3F]",
  "Tantra & Intimacy": "from-[#B85C3F] via-[#7A3E2B] to-[#2D2D2D]",
  "Ceremony & Sound": "from-[#2C4A3E] via-[#1F3A32] to-[#2D2D2D]",
  "Yoga & Meditation": "from-[#2C4A3E] via-[#355B4C] to-[#4A7561]",
  "Healing & Bodywork": "from-[#C9A84C] via-[#A8853A] to-[#B85C3F]",
  "Circle & Community": "from-[#B85C3F] via-[#A8853A] to-[#C9A84C]",
  "Music & Performance": "from-[#2D2D2D] via-[#1F3A32] to-[#2C4A3E]",
  "Art & Culture": "from-[#B85C3F] via-[#7A3E2B] to-[#2C4A3E]",
  "Retreat & Training": "from-[#2C4A3E] via-[#253D33] to-[#2D2D2D]",
  "Other": "from-[#2D2D2D] via-[#2C4A3E] to-[#3A5A4A]",
};

export const TOUR_THEMES = [
  "Cultural & Heritage",
  "Nature & Rice Terraces",
  "Food & Culinary",
  "Spiritual & Healing",
  "Art & Craft",
  "Adventure & Trekking",
  "Photography",
  "Wellness & Yoga",
] as const;
