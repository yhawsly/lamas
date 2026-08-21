import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export const metadata = {
    title: "My Profile | HTU LAMAS",
    description: "Manage your faculty credentials, academic profile, and security credentials",
};

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        include: {
            department: true,
        }
    });

    if (!user) redirect("/login");

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role,
        departmentName: user.department?.name || "Computer Science Department",
    };

    return <ProfileClient user={safeUser} />;
}
