import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    const task = await queries.tasks.getById(taskId);
    if (!task) return new NextResponse("Task Not Found", { status: 404 });

    const list = await queries.tasks.getListById(task.listId);
    if (!list) return new NextResponse("List Not Found", { status: 404 });

    const project = await queries.projects.getById(list.projectId);
    const projectLists = await queries.tasks.getListsByProject(list.projectId);
    const team = await queries.projects.getMembers(list.projectId);

    const comments = await queries.tasks.getComments(taskId);
    const activities = await queries.tasks.getActivities(taskId);

    return NextResponse.json({
      success: true,
      task,
      project,
      projectLists,
      team,
      comments,
      activities
    });

  } catch (error) {
    return new NextResponse("Internal Error", { status: 500, statusText: (error as Error).message });
  }
}