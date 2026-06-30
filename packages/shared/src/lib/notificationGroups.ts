export type DatedItem = {
  created_at: string;
};

export type DateGroup<T extends DatedItem> = {
  title: string;
  items: T[];
};

export function groupByRecency<T extends DatedItem>(items: T[]): DateGroup<T>[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets: Record<string, T[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  for (const item of items) {
    const created = new Date(item.created_at).getTime();
    if (created >= today) buckets.Today.push(item);
    else if (created >= yesterday) buckets.Yesterday.push(item);
    else if (created >= weekAgo) buckets["This Week"].push(item);
    else buckets.Older.push(item);
  }

  return Object.entries(buckets)
    .filter(([, group]) => group.length > 0)
    .map(([title, group]) => ({ title, items: group }));
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
