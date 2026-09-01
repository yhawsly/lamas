import { LecturerDashboardClient } from "@/features/lecturer-dashboard";

export const metadata = {
    title: "Lecturer Dashboard | LAMAS",
    description: "Lecturer dashboard to manage courses, submissions, and compliance.",
};

export default function LecturerPage() {
    return <LecturerDashboardClient />;
}
