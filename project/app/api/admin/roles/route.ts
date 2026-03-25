import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allRoles = await queries.admin.getAllRoles(userId);
    
    return NextResponse.json(allRoles);
  } catch (error) {
    console.error("[ADMIN_ROLES_GET]", error);
    return new NextResponse("Internal Error or Unauthorized", { status: 500 });
  }
}