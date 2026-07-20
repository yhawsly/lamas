import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  let role = (session.user as any).role;
  
  if (!role) {
    // Fallback: Check DB if role is missing in session for some reason
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });
    role = user?.role;
  }

  if (!role) redirect("/login");

  if ((session.user as any).requirePasswordReset) {
    redirect("/reset-password");
  }
  
  if (role === "LECTURER") redirect("/lecturer");
  if (role === "HOD") redirect("/hod");
  if (role === "ADMIN" || role === "SUPER_ADMIN") redirect("/admin");
  if (role === "DEO") redirect("/deo");
  redirect("/login");
}
