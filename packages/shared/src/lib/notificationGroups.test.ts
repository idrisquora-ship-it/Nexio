import { groupByRecency } from "../lib/notificationGroups";

describe("groupByRecency", () => {
  const base = new Date("2026-06-30T12:00:00.000Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(base);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("groups items into today and older buckets", () => {
    const groups = groupByRecency([
      { id: "1", created_at: "2026-06-30T10:00:00.000Z" },
      { id: "2", created_at: "2026-06-20T10:00:00.000Z" },
    ] as Array<{ id: string; created_at: string }>);

    expect(groups.map((g) => g.title)).toEqual(["Today", "Older"]);
    expect(groups[0]?.items).toHaveLength(1);
    expect(groups[1]?.items).toHaveLength(1);
  });
});
