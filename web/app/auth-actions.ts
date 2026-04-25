"use server";

import { redirect } from "next/navigation";
import {
  checkPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export async function signIn(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    redirect("/login?error=empty");
  }
  const role = checkPassword(password as string);
  if (!role) {
    redirect("/login?error=invalid");
  }
  await setSessionCookie(role);
  redirect("/");
}

export async function signOut() {
  await clearSessionCookie();
  redirect("/login");
}
