import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const [allPermissions, mappings] = await Promise.all([
      queries.admin.getAllPermissions(userId),
      queries.admin.getRolePermissions(userId),
    ]);
    
    return NextResponse.json({ allPermissions, mappings });
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}