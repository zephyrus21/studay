import { describe, expect, test } from "vitest";
import {
  countdown,
  daysUntil,
  isDone,
  percent,
  sortSubjects,
  todayIn,
} from "@/lib/progress";

describe("progress", () => {
  test("isDone", () => {
    expect(isDone({ in_class: false, self_study: true })).toBe(true);
    expect(isDone({ in_class: false, self_study: false })).toBe(false);
  });

  test("percent", () => {
    expect(percent(7, 20)).toBe(35);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("todayIn", () => {
  const now = new Date("2026-11-22T20:00:00Z");

  test("uses the given IANA zone", () => {
    expect(todayIn("Asia/Kolkata", now)).toBe("2026-11-23");
  });

  test("invalid zone falls back to UTC", () => {
    expect(todayIn("Not/AZone", now)).toBe("2026-11-22");
  });

  test("missing zone falls back to UTC", () => {
    expect(todayIn(undefined, now)).toBe("2026-11-22");
  });
});

describe("daysUntil", () => {
  test("counts whole days between dates", () => {
    expect(daysUntil("2026-12-10", "2026-11-22")).toBe(18);
  });
});

describe("countdown", () => {
  test("exam today", () => {
    expect(countdown("2026-11-22", "2026-11-22")).toEqual({ label: "exam today 🍀", urgent: true });
  });

  test("exam tomorrow", () => {
    expect(countdown("2026-11-23", "2026-11-22")).toEqual({ label: "🗓 exam in 1 day", urgent: true });
  });

  test("exam in N days, urgent only within 7 days", () => {
    expect(countdown("2026-11-29", "2026-11-22")).toEqual({ label: "🗓 exam in 7 days", urgent: true });
    expect(countdown("2026-12-10", "2026-11-22")).toEqual({ label: "🗓 exam in 18 days", urgent: false });
  });

  test("past exam and missing exam return null", () => {
    expect(countdown("2026-11-21", "2026-11-22")).toBeNull();
    expect(countdown(null, "2026-11-22")).toBeNull();
  });
});

describe("sortSubjects", () => {
  test("upcoming exams soonest first, then others by created_at; does not mutate input", () => {
    const A = { name: "A", exam_date: null, created_at: new Date("2026-01-01") };
    const B = { name: "B", exam_date: "2026-12-10", created_at: new Date("2026-01-02") };
    const C = { name: "C", exam_date: "2026-11-25", created_at: new Date("2026-01-03") };
    const D = { name: "D", exam_date: "2026-11-01", created_at: new Date("2026-01-04") };
    const input = [A, B, C, D];
    const snapshot = [...input];

    const sorted = sortSubjects(input, "2026-11-22");

    expect(sorted.map((s) => s.name)).toEqual(["C", "B", "A", "D"]);
    expect(input).toEqual(snapshot);
    expect(input).not.toBe(sorted);
  });
});
