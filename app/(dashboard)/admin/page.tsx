import { AdminDashboardClient } from "@/features/admin-dashboard";

export const metadata = {
    title: "Admin Dashboard | LAMAS",
    description: "System administration dashboard for terms, users, and platform settings.",
};

export default function AdminPage() {
    return <AdminDashboardClient />;
}
