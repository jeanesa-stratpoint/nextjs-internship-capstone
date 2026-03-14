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
    const projectId = resolvedParams.id;

    const project = await queries.projects.getById(projectId);
    const lists = await queries.tasks.getListsByProject(projectId);
    const team = await queries.projects.getMembers(projectId);

    const defaultList = lists.find(l => l.name.toLowerCase() === "to do") || lists[0];

    return NextResponse.json({
      success: true,
      listId: defaultList?.id,
      team,
      projectDueDate: project?.dueDate
    });

  } catch (error) {
    console.error("[TASK_DEFAULTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}