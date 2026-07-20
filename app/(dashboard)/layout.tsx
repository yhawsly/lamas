import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect("/login");

    if ((session.user as any).requirePasswordReset) {
        redirect("/reset-password");
    }

    return <DashboardShell>{children}</DashboardShell>;
}
