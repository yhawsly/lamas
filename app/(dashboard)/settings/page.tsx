import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
    title: "Settings | LAMAS",
    description: "Manage your institutional preferences and security settings",
};

export default async function SettingsPage() {
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
        departmentName: user.department?.name || "No Department",
    };

    return <SettingsClient user={safeUser} />;
}
