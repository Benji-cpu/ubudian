export const SITE_NAME = "The Ubudian";
export const SITE_DESCRIPTION =
  "Tantra, ceremonies, ecstatic dance, sound journeys, shadow work — Ubud's conscious community in one place.";
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.trim()) || "http://localhost:4000";

export const NAV_LINKS = [
  { label: "Quiz", href: "/quiz" },
  { label: "Events", href: "/events" },
  { label: "Guides", href: "/experiences" },
  { label: "Humans of Ubud", href: "/stories" },
  { label: "Tours", href: "/tours" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Membership", href: "/membership" },
  { label: "About", href: "/about" },
] as const;

export const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Events", href: "/admin/events", icon: "Calendar" },
  { label: "Stories", href: "/admin/stories", icon: "Users" },
  { label: "Blog", href: "/admin/blog", icon: "FileText" },
  { label: "Newsletter", href: "/admin/newsletter", icon: "Mail" },
  { label: "Tours", href: "/admin/tours", icon: "MapPin" },
  { label: "Experiences", href: "/admin/experiences", icon: "Compass" },
  { label: "Subscribers", href: "/admin/subscribers", icon: "UserPlus" },
  { label: "Trusted", href: "/admin/trusted-submitters", icon: "ShieldCheck" },
  { label: "Ingestion", href: "/admin/ingestion", icon: "Zap" },
  { label: "Bookings", href: "/admin/bookings", icon: "CreditCard" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: "Sparkles" },
  { label: "Feedback", href: "/admin/feedback", icon: "MessageSquare" },
] as const;

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
  { label: "My Events", href: "/dashboard/events" },
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
