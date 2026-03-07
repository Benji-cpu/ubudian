const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;
const BEEHIIV_BASE_URL = "https://api.beehiiv.com/v2";

function getHeaders() {
  return {
    Authorization: `Bearer ${BEEHIIV_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function addSubscriber(email: string, firstName?: string) {
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
    console.warn("Beehiiv not configured, skipping subscriber sync");
    return null;
  }

  try {
    const res = await fetch(
      `${BEEHIIV_BASE_URL}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          ...(firstName && { custom_fields: [{ name: "First Name", value: firstName }] }),
        }),
      }
    );

    if (!res.ok) {
      console.error("Beehiiv addSubscriber error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.id || null;
  } catch (err) {
    console.error("Beehiiv addSubscriber failed:", err);
    return null;
  }
}

export async function getSubscribers(page = 1, limit = 100) {
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) return [];

  try {
    const res = await fetch(
      `${BEEHIIV_BASE_URL}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions?page=${page}&limit=${limit}`,
      { headers: getHeaders() }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function addSubscriberWithArchetype(email: string, archetype: string) {
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
    console.warn("Beehiiv not configured, skipping subscriber sync");
    return null;
  }

  try {
    const res = await fetch(
      `${BEEHIIV_BASE_URL}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          custom_fields: [{ name: "Ubud Spirit", value: archetype }],
        }),
      }
    );

    if (!res.ok) {
      console.error("Beehiiv addSubscriberWithArchetype error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.id || null;
  } catch (err) {
    console.error("Beehiiv addSubscriberWithArchetype failed:", err);
    return null;
  }
}

export async function createPost(subject: string, htmlContent: string) {
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
    console.warn("Beehiiv not configured, skipping post creation");
    return null;
  }

  try {
    const res = await fetch(
      `${BEEHIIV_BASE_URL}/publications/${BEEHIIV_PUBLICATION_ID}/posts`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: subject,
          subtitle: "",
          status: "draft",
          content_html: htmlContent,
        }),
      }
    );

    if (!res.ok) {
      console.error("Beehiiv createPost error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.id || null;
  } catch (err) {
    console.error("Beehiiv createPost failed:", err);
    return null;
  }
}
