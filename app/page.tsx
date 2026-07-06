import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/lib/auth";

export default async function Home() {
  const profile = await getProfileOrRedirect();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
