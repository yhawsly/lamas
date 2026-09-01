require("dotenv").config();
const { Client } = require("pg");

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const userRes = await client.query('SELECT id, name, email FROM "User" WHERE email = \'slyyhaw@gmail.com\'');
        const user = userRes.rows[0];
        console.log("SLYYHAW USER:", user);

        if (user) {
            const sectionsRes = await client.query('SELECT id, name, "dayOfWeek", "startTime", venue FROM "CourseSection" WHERE "lecturerId" = $1', [user.id]);
            console.log("SLYYHAW ASSIGNED SECTIONS:", sectionsRes.rows);
        }
    } catch (err) {
        console.error("Query Error:", err);
    } finally {
        await client.end();
    }
}

main();
