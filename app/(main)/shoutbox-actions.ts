"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BODY_LEN = 500;

export type PostShoutState = { error: string | null };

export async function postShout(
  _prev: PostShoutState,
  formData: FormData,
): Promise<PostShoutState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Message cannot be empty." };
  }
  if (body.length > MAX_BODY_LEN) {
    return { error: `Message is too long (max ${MAX_BODY_LEN} characters).` };
  }

  await prisma.shout.create({
    data: {
      userId: BigInt(user.id),
      body,
    },
  });

  revalidatePath("/");
  redirect("/");
}
