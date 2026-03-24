import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses[0].email_address.toLowerCase();

    try {
      const standardRole = await queries.users.getRoleByName("Standard User");

      if (!standardRole) {
         console.error("'Standard User' role not found. Run the seed script");
         return new Response("Missing default role", { status: 500 });
      }

      await queries.users.create({
        id: id,
        email: primaryEmail,
        firstName: first_name || "",
        lastName: last_name || "",
        roleId: standardRole.id, 
      });
      console.log(`Successfully synced user ${id} to database as Standard User`);

      const pendingInvites = await queries.projects.getPendingInvitesByEmail(primaryEmail);

      if (pendingInvites.length > 0) {
        const membersToInsert = pendingInvites.map(invite => ({
          projectId: invite.projectId,
          userId: id,
          role: "member"
        }));

        await queries.projects.batchAddMembers(membersToInsert);

        const inviteIds = pendingInvites.map(invite => invite.id);
        await queries.projects.batchUpdateInviteStatus(inviteIds, 'accepted');

        console.log(`Automatically added user ${id} to ${pendingInvites.length} projects based on pending invites.`);
      }
    } catch (error) {
      console.error(`Error processing user.created for ${id}:`, error);
      return new Response("Error inserting user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}