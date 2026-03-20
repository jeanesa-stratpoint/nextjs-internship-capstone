import { projectSchema, taskSchema, commentSchema } from "@/lib/validations";

describe("Schema Validations", () => {
  describe("Project Schema", () => {
    it("accepts a valid project", () => {
      const result = projectSchema.safeParse({ name: "Capstone Project", status: "active" });
      expect(result.success).toBe(true);
    });

    it("rejects a project with an empty name", () => {
      const result = projectSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Project name is required");
      }
    });

    it("rejects a past due date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago
      
      const result = projectSchema.safeParse({ name: "Late Project", dueDate: pastDate });
      expect(result.success).toBe(false);
    });
  });

  describe("Task Schema", () => {
    it("accepts a valid task", () => {
      const result = taskSchema.safeParse({
        title: "Fix drag and drop",
        priority: "high",
        listId: "123e4567-e89b-12d3-a456-426614174000" // Valid UUID
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid priority", () => {
      const result = taskSchema.safeParse({
        title: "Bad priority task",
        priority: "super-urgent", // Not in Enum
        listId: "123e4567-e89b-12d3-a456-426614174000"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Comment Schema", () => {
    it("rejects empty comments", () => {
      const result = commentSchema.safeParse({
        content: "",
        taskId: "123e4567-e89b-12d3-a456-426614174000"
      });
      expect(result.success).toBe(false);
    });
  });
});