"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createTaskAction(formData: unknown, projectId: string) {
  try {
    // 1. Validate the incoming data using the Zod schema we built earlier
    // This ensures no one can inject bad data into your database!
    const validatedData = taskSchema.parse(formData);

    // 2. Insert the new task into the Neon Postgres database
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate,
        listId: validatedData.listId,
        order: 0, // <--- ADDED THIS: Sets the new task at the top of the column
        assigneeId: validatedData.assigneeId,
      })
      .returning();

    // 3. Clear the Next.js cache for this specific project page
    // This guarantees that when the server responds, the user sees the newest data instantly.
    revalidatePath(`/projects/${projectId}`);

    return { success: true, task: newTask };
    
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task. Please check your inputs." };
  }
}