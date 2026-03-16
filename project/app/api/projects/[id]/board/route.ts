import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { lists } from "@/lib/db/schema";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const project = await queries.projects.getById(projectId);
    if (!project) {
      return new NextResponse("Project Not Found", { status: 404 });
    }

    let boardLists = await queries.tasks.getListsByProject(projectId);

    if (boardLists.length === 0) {
      boardLists = await db.insert(lists).values([
        { name: "To Do", projectId: projectId, order: 0, isCompleteStage: false },
        { name: "In Progress", projectId: projectId, order: 1, isCompleteStage: false },
        { name: "Review", projectId: projectId, order: 2, isCompleteStage: false },
        { name: "Done", projectId: projectId, order: 3, isCompleteStage: true }, 
      ]).returning();
    }
    const listIds = boardLists.map((l) => l.id);
    const tasks = await queries.tasks.getByListIds(listIds);
    const team = await queries.projects.getMembers(projectId);

    return NextResponse.json({
      project,
      lists: boardLists,
      tasks,
      team,
    });

  } catch (error) {
    console.error("[PROJECT_BOARD_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}