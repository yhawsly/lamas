import { HodDashboardClient } from "@/features/hod-dashboard";

export const metadata = {
    title: "HOD Dashboard | LAMAS",
    description: "Head of Department dashboard for curriculum and staff oversight.",
};

export default function HodPage() {
    return <HodDashboardClient />;
}
