import { DeoDashboardClient } from "@/features/deo-dashboard";

export const metadata = {
    title: "DEO Dashboard | LAMAS",
    description: "Data Entry Operator dashboard for managing records and allocations.",
};

export default function DeoPage() {
    return <DeoDashboardClient />;
}
