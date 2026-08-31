export const KNOWN_COURSES: Record<string, string> = {
    "CS101": "Introduction to Computer Science & Systems",
    "CS102": "Programming Fundamentals in C/C++",
    "CS201": "Data Structures & Algorithms",
    "CS202": "Object-Oriented Programming with Java",
    "CS203": "Discrete Mathematics & Logic",
    "CS301": "Web Development & Cloud Architecture",
    "CS302": "Database Systems & SQL Programmability",
    "CS303": "Operating Systems & Systems Programming",
    "CS401": "Artificial Intelligence & Neural Networks",
    "CS402": "Software Engineering & DevOps Practices",
    "CS403": "Computer Networks & Distributed Systems"
};

export function getCourseTitle(courseCode?: string | null): string {
    if (!courseCode) return "";
    const cleanCode = courseCode.trim().toUpperCase();
    return KNOWN_COURSES[cleanCode] || "";
}
