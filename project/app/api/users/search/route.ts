import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify the user is actually logged in before letting them search
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Grab the search text from the URL (e.g., /api/users/search?q=john)
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]); // Don't search if they barely typed anything
    }

    // 3. Securely ask Clerk to find users matching this email/name query
    const client = await clerkClient();
    const response = await client.users.getUserList({
      query: query,
      limit: 5, // Keep it snappy, only return the top 5 matches
    });

    // 4. Clean up the data so we only send what the frontend actually needs
    const safeUsers = response.data.map((user) => {
      // Clerk stores emails in an array, so we grab the primary one
      const email = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress || user.emailAddresses[0]?.emailAddress;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: email,
        imageUrl: user.imageUrl, // We will use this for the Avatar!
      };
    });

    // 5. Send the clean list back to your modal
    return NextResponse.json(safeUsers);

  } catch (error) {
    console.error("Error searching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}