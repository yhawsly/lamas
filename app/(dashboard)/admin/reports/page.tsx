import AcademicPortfolio from "@/components/analytics/AcademicPortfolio";
import { auth } from "@/auth";
import TabsNav from "@/components/admin/TabsNav";

export default async function AdminReportsPage() {
    const session = await auth();
    const role = (session?.user as any)?.role || "ADMIN";

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <TabsNav
                title="Analytics & Reports"
                description="Institution-wide performance metrics and comprehensive portfolios"
                tabs={[
                    { label: "Live Analytics", href: "/admin/analytics" },
                    { label: "Academic Portfolio", href: "/admin/reports" }
                ]}
            />
            <AcademicPortfolio role={role} />
        </div>
    );
}
