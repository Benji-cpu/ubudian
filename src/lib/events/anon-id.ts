/** A random per-browser id for anonymous reader signals. Never tied to a person. */
export function getAnonId(): string | null {
  try {
    let id = localStorage.getItem("ubudian-anon-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ubudian-anon-id", id);
    }
    return id;
  } catch {
    return null;
  }
}
