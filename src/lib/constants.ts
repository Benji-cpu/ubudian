export const SITE_NAME = "The Ubudian";
export const SITE_DESCRIPTION =
  "Your insider guide to Ubud — events, stories, tours, and the weekly newsletter.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const NAV_LINKS = [
  { label: "Quiz", href: "/quiz" },
  { label: "Events", href: "/events" },
  { label: "Humans of Ubud", href: "/stories" },
  { label: "Tours", href: "/tours" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Blog", href: "/blog" },
] as const;

export const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Events", href: "/admin/events", icon: "Calendar" },
  { label: "Stories", href: "/admin/stories", icon: "Users" },
  { label: "Blog", href: "/admin/blog", icon: "FileText" },
  { label: "Newsletter", href: "/admin/newsletter", icon: "Mail" },
  { label: "Tours", href: "/admin/tours", icon: "MapPin" },
  { label: "Subscribers", href: "/admin/subscribers", icon: "UserPlus" },
  { label: "Trusted", href: "/admin/trusted-submitters", icon: "ShieldCheck" },
  { label: "Ingestion", href: "/admin/ingestion", icon: "Zap" },
] as const;

export const EVENT_CATEGORIES = [
  "Music & Live Performance",
  "Yoga & Wellness",
  "Art & Culture",
  "Food & Drink",
  "Community & Social",
  "Workshop & Class",
  "Market & Shopping",
  "Sports & Adventure",
  "Kids & Family",
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
] as const;

export const DASHBOARD_NAV_LINKS = [
  { label: "Overview", href: "/dashboard" },
  { label: "My Spirit", href: "/dashboard/archetype" },
  { label: "My Events", href: "/dashboard/events" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  "Music & Live Performance": "🎵",
  "Yoga & Wellness": "🧘",
  "Art & Culture": "🎨",
  "Food & Drink": "🍽️",
  "Community & Social": "🤝",
  "Workshop & Class": "✏️",
  "Market & Shopping": "🛍️",
  "Sports & Adventure": "🏄",
  "Kids & Family": "👨‍👩‍👧",
  "Other": "📌",
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  "Music & Live Performance": "from-purple-600 to-indigo-800",
  "Yoga & Wellness": "from-emerald-500 to-teal-700",
  "Art & Culture": "from-rose-500 to-pink-700",
  "Food & Drink": "from-orange-500 to-amber-700",
  "Community & Social": "from-sky-500 to-blue-700",
  "Workshop & Class": "from-yellow-500 to-amber-600",
  "Market & Shopping": "from-fuchsia-500 to-purple-700",
  "Sports & Adventure": "from-lime-500 to-green-700",
  "Kids & Family": "from-cyan-400 to-sky-600",
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
