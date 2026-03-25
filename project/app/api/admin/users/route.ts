import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allUsers = await queries.admin.getSystemUsers(userId);
    
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return new NextResponse("Internal Error or Unauthorized", { status: 500 });
  }
}