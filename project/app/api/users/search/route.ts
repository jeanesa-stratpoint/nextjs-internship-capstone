import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // (e.g., /api/users/search?q=john)
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]); 
    }

    const client = await clerkClient();
    const response = await client.users.getUserList({
      query: query,
      limit: 5, 
    });

    const safeUsers = response.data.map((user) => {
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: email,
        imageUrl: user.imageUrl, 
      };
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error searching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
