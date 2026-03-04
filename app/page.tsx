import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role === "LECTURER") redirect("/lecturer");
  if (role === "HOD") redirect("/hod");
  if (role === "ADMIN" || role === "SUPER_ADMIN") redirect("/admin");
  redirect("/login");
}
