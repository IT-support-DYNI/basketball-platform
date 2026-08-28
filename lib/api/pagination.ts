import { BadRequestError } from "./errors";

export type ListParams<S extends string = string> = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  sort: { field: S; dir: "asc" | "desc" } | null;
  q: string | null;
};

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

/**
 * Parses the standard list query params: `?page=&pageSize=&sort=&q=`.
 * `sort` accepts `field` or `-field` (descending) and must be in `sortable`.
 */
export function parseListParams<S extends string>(
  searchParams: URLSearchParams,
  opts: { sortable: readonly S[]; defaultSort?: `${S}` | `-${S}` } = { sortable: [] as unknown as readonly S[] },
): ListParams<S> {
  const page = clampInt(searchParams.get("page"), 1, 1_000_000, 1);
  const pageSize = clampInt(searchParams.get("pageSize"), 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);

  const rawSort = searchParams.get("sort") ?? opts.defaultSort ?? null;
  let sort: ListParams<S>["sort"] = null;
  if (rawSort) {
    const dir = rawSort.startsWith("-") ? "desc" : "asc";
    const field = (rawSort.startsWith("-") ? rawSort.slice(1) : rawSort) as S;
    if (!opts.sortable.includes(field)) {
      throw new BadRequestError(
        `Can't sort by "${field}". Allowed: ${opts.sortable.join(", ") || "(none)"}.`,
      );
    }
    sort = { field, dir };
  }

  const q = (searchParams.get("q") ?? "").trim() || null;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, sort, q };
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new BadRequestError(`Expected an integer, got "${raw}".`);
  return Math.min(max, Math.max(min, n));
}

/** Turn the parsed sort into a Prisma `orderBy` (or undefined). */
export function toPrismaOrderBy<S extends string>(
  sort: ListParams<S>["sort"],
): Record<string, "asc" | "desc"> | undefined {
  return sort ? { [sort.field]: sort.dir } : undefined;
}
