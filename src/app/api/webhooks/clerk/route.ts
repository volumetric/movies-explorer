import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to your environment variables");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    await convex.mutation(api.users.createUser, {
      clerkId: id,
      email: email_addresses[0]?.email_address || "",
      name: [first_name, last_name].filter(Boolean).join(" ") || undefined,
      imageUrl: image_url || undefined,
    });
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, image_url } = evt.data;

    await convex.mutation(api.users.updateUser, {
      clerkId: id,
      name: [first_name, last_name].filter(Boolean).join(" ") || undefined,
      imageUrl: image_url || undefined,
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      await convex.mutation(api.users.deleteUser, {
        clerkId: id,
      });
    }
  }

  return new Response("", { status: 200 });
}
