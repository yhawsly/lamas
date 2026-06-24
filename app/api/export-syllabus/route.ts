import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { topics = [], classes = [] } = data;

    const workbook = new ExcelJS.Workbook();
    
    // Topics Sheet
    const topicsSheet = workbook.addWorksheet("Topics");
    topicsSheet.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Reading List", key: "reading_list", width: 30 },
    ];

    topics.forEach((t: any) => {
      topicsSheet.addRow({
        title: t.title || "",
        description: t.description || "",
        reading_list: t.reading_list || "",
      });
    });

    topicsSheet.getRow(1).font = { bold: true };

    // Modules Sheet
    // We use the first class's modules as the master course schedule
    const modulesSheet = workbook.addWorksheet("Modules");
    modulesSheet.columns = [
      { header: "Week", key: "week", width: 10 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Lesson Plan", key: "lesson_plan", width: 30 },
    ];

    const masterModules = classes.length > 0 ? classes[0].modules : [];
    masterModules.forEach((m: any) => {
      modulesSheet.addRow({
        week: m.week || "",
        title: m.title || "",
        description: m.description || "",
        lesson_plan: m.lesson_plan || "",
      });
    });

    modulesSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="course_syllabus.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
  }
}
