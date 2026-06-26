import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("syllabus") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV." },
        { status: 400 }
      );
    }

    // 1. Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Parse with ExcelJS
    const workbook = new ExcelJS.Workbook();

    if (ext === ".csv") {
      await workbook.csv.read(require("stream").Readable.from(buffer));
    } else {
      await workbook.xlsx.load(buffer as any);
    }

    if (workbook.worksheets.length === 0) {
      return NextResponse.json({ error: "The uploaded file contains no sheets." }, { status: 400 });
    }

    // 3. Try to find sheets by name, or fall back to positional
    const topicsSheet =
      workbook.getWorksheet("Topics") ||
      workbook.getWorksheet("topics") ||
      workbook.getWorksheet("Course Topics") ||
      workbook.worksheets[0];

    const modulesSheet =
      workbook.getWorksheet("Modules") ||
      workbook.getWorksheet("modules") ||
      workbook.getWorksheet("Weekly Modules") ||
      workbook.getWorksheet("Schedule") ||
      (workbook.worksheets.length > 1 ? workbook.worksheets[1] : null);

    // Helper: parse a sheet into an array of objects using the first row as headers
    const parseSheet = (sheet: ExcelJS.Worksheet): Record<string, string>[] => {
      const rows: Record<string, string>[] = [];
      const headerRow = sheet.getRow(1);
      const headers: string[] = [];

      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || "").trim().toLowerCase();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const rowData: Record<string, string> = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            const value = String(cell.value || "").trim();
            rowData[header] = value;
            if (value) hasData = true;
          }
        });

        if (hasData) {
          rows.push(rowData);
        }
      });

      return rows;
    };

    // 4. Parse topics
    const topicsRaw = parseSheet(topicsSheet);
    const topics = topicsRaw.map((row, i) => ({
      id: Date.now() + i,
      title: row["title"] || row["topic"] || row["topic title"] || row["name"] || `Topic ${i + 1}`,
      description: row["description"] || row["desc"] || row["details"] || row["overview"] || "",
      reading_list: row["reading list"] || row["readings"] || row["resources"] || "",
    }));

    // 5. Parse modules (from a second sheet if available, otherwise derive from topics)
    let modules: any[] = [];

    if (modulesSheet && modulesSheet !== topicsSheet) {
      const modulesRaw = parseSheet(modulesSheet);
      modules = modulesRaw.map((row, i) => ({
        id: Date.now() + 100 + i,
        week: parseInt(row["week"] || row["wk"] || String(i + 1), 10),
        title: row["title"] || row["module"] || row["module title"] || row["topic"] || `Week ${i + 1}`,
        description: row["description"] || row["desc"] || row["details"] || row["overview"] || "",
        lesson_plan: row["lesson plan"] || row["lesson_plan"] || row["plan"] || "",
      }));
    } else {
      // If there's only one sheet, try to derive modules from columns like "week"
      const hasWeekColumn = topicsRaw.length > 0 && ("week" in topicsRaw[0] || "wk" in topicsRaw[0]);
      if (hasWeekColumn) {
        modules = topicsRaw.map((row, i) => ({
          id: Date.now() + 100 + i,
          week: parseInt(row["week"] || row["wk"] || String(i + 1), 10),
          title: row["title"] || row["topic"] || row["module"] || `Week ${i + 1}`,
          description: row["description"] || row["desc"] || row["details"] || "",
          lesson_plan: row["lesson plan"] || row["lesson_plan"] || "",
        }));
      }
    }

    return NextResponse.json({
      topics,
      modules,
      sheetInfo: {
        topicsSheet: topicsSheet.name,
        modulesSheet: modulesSheet?.name || null,
        totalSheets: workbook.worksheets.length,
      },
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract data from the Excel file." },
      { status: 500 }
    );
  }
}
