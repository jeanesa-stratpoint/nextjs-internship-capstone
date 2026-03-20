import { formatDate, getTodayString } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("formatDate", () => {
    it("formats a standard Date object correctly", () => {
      // Create a fixed date: January 1, 2026
      const testDate = new Date("2026-01-01T12:00:00Z");
      
      const formatted = formatDate(testDate);
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("handles null or undefined safely", () => {
      const formatted = formatDate(null as unknown as Date);
      expect(formatted).toBeDefined(); 
    });
  });

  describe("getTodayString", () => {
    it("returns a string in YYYY-MM-DD format", () => {
      const today = getTodayString();
      // Regex to match YYYY-MM-DD
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});