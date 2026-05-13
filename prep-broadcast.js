const { Client } = require("pg");
require("dotenv").config();

async function prepare() {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await db.connect();
        
        // 1. Reset all emails to dummy
        await db.query("UPDATE \"User\" SET email = id || '@dummy.com' WHERE role IN ('LECTURER', 'HOD');");
        
        // 2. Set Lecturer 1 to YOUR verified email
        await db.query("UPDATE \"User\" SET email = 'slyyhaw@gmail.com' WHERE name = 'Dr. Sarah Lim' OR id = 4;");
        
        console.log("✅ Database prepared for single-target broadcast to 'slyyhaw@gmail.com'.");
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

prepare();
