import { DeoDashboardClient } from "@/features/deo-dashboard";

export const metadata = {
    title: "DEO Dashboard | LAMAS",
    description: "Department Examination Officer dashboard for managing records and allocations.",
};

export default function DeoPage() {
    return <DeoDashboardClient />;
}
