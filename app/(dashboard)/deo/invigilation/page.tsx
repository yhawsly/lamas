"use client";

import { useEffect, useState } from "react";
import InvigilationMatrixTab, { InvigilationMatrixSkeleton } from "@/components/deo/InvigilationMatrixTab";
import HallsManagementModal from "@/components/deo/HallsManagementModal";
import { useTerm } from "@/context/TermContext";

export default function DeoInvigilationPage() {
    const { selectedTermId, isArchiveMode } = useTerm();
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [hallsModalOpen, setHallsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
                const [cRes, lRes] = await Promise.all([
                    fetch(`/api/courses${termParam}`),
                    fetch("/api/admin/users?role=LECTURER&limit=200"),
                ]);
                const cData = await cRes.json();
                const lData = await lRes.json();
                setCourses(cData.courses || []);
                setLecturers(lData.data || []);
            } catch (err) {
                console.error("Failed to load data for invigilation matrix:", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [selectedTermId]);

    if (loading) {
        return (
            <div className="w-full space-y-6 animate-in fade-in duration-500">
                <InvigilationMatrixSkeleton />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <InvigilationMatrixTab
                courses={courses}
                lecturers={lecturers}
                onOpenHallsModal={() => setHallsModalOpen(true)}
            />

            <HallsManagementModal
                isOpen={hallsModalOpen}
                onClose={() => setHallsModalOpen(false)}
                disabled={isArchiveMode}
            />
        </div>
    );
}
