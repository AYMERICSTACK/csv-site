"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/admin/matchs");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/admin/matchs",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect.",
      };
    }

    throw error;
  }
}
