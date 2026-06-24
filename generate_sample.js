const ExcelJS = require('exceljs');

async function createSampleExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Topics
  const topicsSheet = workbook.addWorksheet('Topics');
  topicsSheet.columns = [
    { header: 'Title', key: 'title', width: 25 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Reading List', key: 'reading', width: 30 }
  ];
  
  topicsSheet.addRow({
    title: 'Introduction to Web Dev',
    desc: 'Overview of the modern web stack',
    reading: 'Chapter 1: The Web'
  });
  topicsSheet.addRow({
    title: 'React Fundamentals',
    desc: 'Components, Props, and State',
    reading: 'React Docs: Quick Start'
  });
  topicsSheet.addRow({
    title: 'Database Design',
    desc: 'Relational vs NoSQL databases',
    reading: 'SQL Anti-patterns'
  });

  // Sheet 2: Modules
  const modulesSheet = workbook.addWorksheet('Modules');
  modulesSheet.columns = [
    { header: 'Week', key: 'week', width: 10 },
    { header: 'Title', key: 'title', width: 25 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Lesson Plan', key: 'plan', width: 30 }
  ];

  modulesSheet.addRow({
    week: 1,
    title: 'Getting Started',
    desc: 'Setting up the environment and learning the basics',
    plan: 'Lecture: 2 hrs, Lab: 1 hr'
  });
  modulesSheet.addRow({
    week: 2,
    title: 'Building UIs',
    desc: 'Creating interactive user interfaces with React',
    plan: 'Lecture: 1.5 hrs, Lab: 2 hrs'
  });

  // Save to Desktop
  const path = require('path');
  const os = require('os');
  const desktopPath = path.join(os.homedir(), 'Desktop', 'sample_syllabus.xlsx');
  
  await workbook.xlsx.writeFile(desktopPath);
  console.log('Successfully created:', desktopPath);
}

createSampleExcel().catch(console.error);
