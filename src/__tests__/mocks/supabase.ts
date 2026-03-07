import { vi } from "vitest";

interface MockQueryResult {
  data: unknown;
  error: null | { message: string; code: string };
}

function createChainableMock(result: MockQueryResult = { data: null, error: null }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = new Proxy(mock, {
    get(target, prop) {
      if (prop === "then") return undefined; // Not a promise
      if (typeof prop === "symbol") return undefined;

      if (!target[prop as string]) {
        target[prop as string] = vi.fn().mockReturnValue(
          new Proxy({}, {
            get(_, innerProp) {
              if (innerProp === "then") return undefined;
              if (typeof innerProp === "symbol") return undefined;

              // Terminal methods that return the result
              if (innerProp === "single" || innerProp === "maybeSingle") {
                return vi.fn().mockResolvedValue(result);
              }

              // For chain-ending, return the result promise
              return vi.fn().mockReturnValue(
                Object.assign(Promise.resolve(result), {
                  single: vi.fn().mockResolvedValue(result),
                  maybeSingle: vi.fn().mockResolvedValue(result),
                  select: vi.fn().mockResolvedValue(result),
                  eq: vi.fn().mockReturnThis(),
                  neq: vi.fn().mockReturnThis(),
                  gte: vi.fn().mockReturnThis(),
                  lte: vi.fn().mockReturnThis(),
                  or: vi.fn().mockReturnThis(),
                  order: vi.fn().mockReturnThis(),
                  limit: vi.fn().mockResolvedValue(result),
                  contains: vi.fn().mockReturnThis(),
                })
              );
            },
          })
        );
      }
      return target[prop as string];
    },
  });

  return chainable;
}

export function createMockSupabase(overrides: {
  from?: (table: string) => MockQueryResult;
} = {}) {
  const defaultResult: MockQueryResult = { data: [], error: null };

  return {
    from: vi.fn((table: string) => {
      const result = overrides.from ? overrides.from(table) : defaultResult;
      return createChainableMock(result);
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
