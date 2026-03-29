"use server";

import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { getHomePathByRole } from "@/lib/roles";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const session = await auth();
    const roleHome = getHomePathByRole(session?.user?.role);

    return {
      success: true,
      redirectTo: roleHome,
    };
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
