export interface FeedbackContext {
  pageUrl: string;
  pageTitle: string;
  routeParams: Record<string, string>;
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
  contextSummary: string;
}

const ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  params: string[];
}> = [
  { pattern: /^\/events\/([^/]+)$/, label: 'Event', params: ['eventSlug'] },
  { pattern: /^\/blog\/([^/]+)$/, label: 'Blog Post', params: ['postSlug'] },
  { pattern: /^\/stories\/([^/]+)$/, label: 'Story', params: ['storySlug'] },
  { pattern: /^\/tours\/([^/]+)$/, label: 'Tour', params: ['tourSlug'] },
  { pattern: /^\/experiences\/([^/]+)$/, label: 'Experience', params: ['experienceSlug'] },
  { pattern: /^\/guides\/([^/]+)$/, label: 'Guide', params: ['guideSlug'] },
  { pattern: /^\/practitioners\/([^/]+)$/, label: 'Practitioner', params: ['practitionerSlug'] },
  { pattern: /^\/places\/([^/]+)$/, label: 'Place', params: ['placeSlug'] },
  { pattern: /^\/partners\/([^/]+)$/, label: 'Partner', params: ['partnerSlug'] },
  { pattern: /^\/booking\/([^/]+)$/, label: 'Booking', params: ['bookingId'] },
  { pattern: /^\/admin\/feedback\/([^/]+)$/, label: 'Admin > Feedback', params: ['feedbackId'] },
  { pattern: /^\/admin/, label: 'Admin', params: [] },
  { pattern: /^\/dashboard/, label: 'Dashboard', params: [] },
  { pattern: /^\/events$/, label: 'Events', params: [] },
  { pattern: /^\/blog$/, label: 'Blog', params: [] },
  { pattern: /^\/stories$/, label: 'Stories', params: [] },
  { pattern: /^\/tours$/, label: 'Tours', params: [] },
  { pattern: /^\/experiences$/, label: 'Experiences', params: [] },
  { pattern: /^\/guides$/, label: 'Guides', params: [] },
  { pattern: /^\/practitioners$/, label: 'Practitioners', params: [] },
  { pattern: /^\/places$/, label: 'Places', params: [] },
  { pattern: /^\/membership/, label: 'Membership', params: [] },
  { pattern: /^\/newsletter/, label: 'Newsletter', params: [] },
  { pattern: /^\/about/, label: 'About', params: [] },
  { pattern: /^\/$/, label: 'Home', params: [] },
];

export function captureFeedbackContext(): FeedbackContext {
  const pathname = window.location.pathname;
  const pageTitle = document.title;

  const routeParams: Record<string, string> = {};
  let contextSummary = pathname;

  for (const route of ROUTE_PATTERNS) {
    const match = pathname.match(route.pattern);
    if (match) {
      contextSummary = route.label;
      route.params.forEach((param, i) => {
        if (match[i + 1]) {
          routeParams[param] = match[i + 1];
        }
      });
      break;
    }
  }

  return {
    pageUrl: window.location.href,
    pageTitle,
    routeParams,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    contextSummary,
  };
}
