import AcademicPortfolio from "@/components/analytics/AcademicPortfolio";
import { auth } from "@/auth";

export default async function LecturerReportsPage() {
    const session = await auth();
    const role = (session?.user as any)?.role || "LECTURER";

    return (
        <div className="p-4">
            <AcademicPortfolio role={role} />
        </div>
    );
}
