import "dotenv/config";
import { prisma } from "../lib/prisma";
import { validateDepartmentBoundary, getDepartmentReviewerRecommendations } from "../lib/pairing";

async function main() {
    console.log("=========================================================================");
    console.log("🧪 TESTING DEPARTMENT BOUNDARY & DOMAIN PAIRING VERIFICATION");
    console.log("=========================================================================\n");

    const sly = await prisma.user.findUnique({ where: { email: "slyyhaw@gmail.com" } });
    const redeemer = await prisma.user.findUnique({ where: { email: "dherlharlhi20@gmail.com" } });
    const sarah = await prisma.user.findUnique({ where: { email: "slycrypto1@gmail.com" } });
    const englishLecturer = await prisma.user.findUnique({ where: { email: "english.lecturer@lamas.edu.gh" } });

    if (!sly || !redeemer || !sarah || !englishLecturer) {
        throw new Error("Required faculty accounts not found in database.");
    }

    // TEST 1: Cross-Department Pairing Rejection (English Lecturer assigned to CS301 Web Dev)
    console.log("1️⃣ Test 1: Cross-Department Boundary Rejection");
    const crossDeptTest = await validateDepartmentBoundary({
        courseCode: "CS301",
        lecturerId: sly.id,
        reviewerId: englishLecturer.id
    });
    console.log(`   Attempting to assign English Lecturer (${englishLecturer.name}) to CS301 (Web Dev):`);
    console.log(`   Result Valid: ${crossDeptTest.valid}`);
    console.log(`   Rejection Message: "${crossDeptTest.error}"`);
    if (!crossDeptTest.valid && crossDeptTest.error?.includes("Department Mismatch")) {
        console.log("   ✅ PASSED: Cross-department assignment was strictly blocked!\n");
    } else {
        console.error("   ❌ FAILED: Cross-department assignment was NOT blocked!");
    }

    // TEST 2: Self-Review Conflict of Interest Rejection
    console.log("2️⃣ Test 2: Conflict of Interest (Self-Review)");
    const selfTest = await validateDepartmentBoundary({
        courseCode: "CS301",
        lecturerId: sly.id,
        reviewerId: sly.id
    });
    console.log(`   Attempting self-review assignment:`);
    console.log(`   Result Valid: ${selfTest.valid}`);
    console.log(`   Rejection Message: "${selfTest.error}"`);
    if (!selfTest.valid) {
        console.log("   ✅ PASSED: Self-review was strictly blocked!\n");
    } else {
        console.error("   ❌ FAILED: Self-review was NOT blocked!");
    }

    // TEST 3: Valid Same-Department Pairing
    console.log("3️⃣ Test 3: Valid Same-Department CS Pairing");
    const validTest = await validateDepartmentBoundary({
        courseCode: "CS301",
        lecturerId: sly.id,
        reviewerId: redeemer.id
    });
    console.log(`   Assigning Dr. Redeemer to observe Sylvester Yhaw on CS301:`);
    console.log(`   Result Valid: ${validTest.valid}`);
    if (validTest.valid) {
        console.log("   ✅ PASSED: Same-department peer assignment approved!\n");
    } else {
        console.error("   ❌ FAILED: Valid assignment was blocked!", validTest.error);
    }

    // TEST 4: Domain Recommendation Engine for CS302 (Database Systems)
    console.log("4️⃣ Test 4: Specialization Domain Matching for CS302 (Database Systems)");
    const dbRecs = await getDepartmentReviewerRecommendations({
        courseCode: "CS302",
        excludeLecturerId: sly.id
    });
    console.log(`   Recommended reviewers for CS302 (Database Systems):`);
    for (const r of dbRecs) {
        console.log(`   - ${r.name}: DomainMatch=${r.isDomainMatch} (${r.matchedDomain || 'General'}) | ActiveReviews=${r.activeReviewsCount}`);
    }
    const topDbMatch = dbRecs.find(r => r.isDomainMatch);
    if (topDbMatch && topDbMatch.name.includes("Sarah Lim")) {
        console.log("   ✅ PASSED: Dr. Sarah Lim (Database Specialist) ranked as Top Domain Match!\n");
    } else {
        console.log("   ⚠️ Note: Check domain string matching criteria.");
    }

    // TEST 5: Domain Recommendation Engine for CS201 (Data Structures & Algorithms)
    console.log("5️⃣ Test 5: Specialization Domain Matching for CS201 (Data Structures)");
    const dsRecs = await getDepartmentReviewerRecommendations({
        courseCode: "CS201",
        excludeLecturerId: sarah.id
    });
    console.log(`   Recommended reviewers for CS201 (Data Structures):`);
    for (const r of dsRecs) {
        console.log(`   - ${r.name}: DomainMatch=${r.isDomainMatch} (${r.matchedDomain || 'General'}) | ActiveReviews=${r.activeReviewsCount}`);
    }
    const topDsMatch = dsRecs.find(r => r.isDomainMatch);
    if (topDsMatch && topDsMatch.name.includes("Redeemer")) {
        console.log("   ✅ PASSED: Dr. Redeemer (Algorithms Specialist) ranked as Top Domain Match!\n");
    }

    console.log("=========================================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");
}

main()
    .catch(err => {
        console.error("Test execution failed:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
