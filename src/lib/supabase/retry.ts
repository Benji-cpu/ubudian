const MAX_RETRIES = 2;
const BACKOFF_MS = [500, 1000];

type HasError = { error: { code?: string; message: string } | null };

export async function queryWithRetry<T extends HasError>(
  queryFn: () => PromiseLike<T>,
  label: string
): Promise<T> {
  let attempt = 0;

  while (true) {
    const result = await queryFn();

    if (!result.error || result.error.code !== "PGRST205") {
      return result;
    }

    attempt++;
    if (attempt > MAX_RETRIES) {
      console.error(
        `[${label}] PGRST205 persisted after ${attempt} retries — schema cache may be stale`
      );
      return result;
    }

    console.warn(
      `[${label}] PGRST205 schema cache miss — retry ${attempt}/${MAX_RETRIES} in ${BACKOFF_MS[attempt - 1]}ms`
    );
    await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
  }
}
