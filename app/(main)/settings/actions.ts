"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { deleteLinkedSpotifyAccountForUser } from "@/lib/user-spotify-account";

export async function unlinkSpotifyAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const rawId = formData.get("accountId");
  if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
    redirect("/settings?spotify_error=invalid_account");
  }

  let accountId: bigint;
  try {
    accountId = BigInt(rawId);
  } catch {
    redirect("/settings?spotify_error=invalid_account");
  }

  const deleted = await deleteLinkedSpotifyAccountForUser(BigInt(user.id), accountId);
  if (!deleted) {
    redirect("/settings?spotify_error=unlink_failed");
  }

  revalidatePath("/settings");
  redirect("/settings?spotify_unlinked=1");
}
