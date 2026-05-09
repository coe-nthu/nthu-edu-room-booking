import { vi } from "vitest"

type QueryResult = {
  data: unknown
  error: unknown
}

type ResultQueue = Record<string, QueryResult[]>

export type SupabaseQueryMock = ReturnType<typeof createSupabaseQueryMock>

export function createSupabaseQueryMock(resultsByTable: ResultQueue) {
  const queues = Object.fromEntries(
    Object.entries(resultsByTable).map(([table, results]) => [table, [...results]]),
  ) as ResultQueue

  const calls: { table: string; method: string; args: unknown[] }[] = []

  const nextResult = (table: string): QueryResult => {
    const result = queues[table]?.shift()
    if (!result) {
      return { data: null, error: null }
    }
    return result
  }

  const createQuery = (table: string) => {
    const query = {
      select: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "select", args })
        return query
      }),
      order: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "order", args })
        return query
      }),
      eq: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "eq", args })
        return query
      }),
      in: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "in", args })
        return query
      }),
      filter: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "filter", args })
        return query
      }),
      gte: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "gte", args })
        return query
      }),
      neq: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "neq", args })
        return query
      }),
      insert: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "insert", args })
        return query
      }),
      update: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "update", args })
        return query
      }),
      delete: vi.fn((...args: unknown[]) => {
        calls.push({ table, method: "delete", args })
        return query
      }),
      single: vi.fn(async () => nextResult(table)),
      then: (
        resolve: (value: QueryResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(nextResult(table)).then(resolve, reject),
    }

    return query
  }

  const client = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn((table: string) => createQuery(table)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/image.jpg" } })),
      })),
    },
  }

  return { client, calls }
}
