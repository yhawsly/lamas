const { Client } = require("pg");
const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function broadcastTest() {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    
    const subject = "Flash Update: Tomorrow's Inter-House Sports Meet";
    const message = `For a more urgent or concise communication, here is a "Flash Update" style message. This is perfect for quick reminders or singular announcements.

Subject: Reminder: Tomorrow’s Inter-House Sports Meet
Dear Parents,

This is a quick reminder regarding our Annual Inter-House Sports Meet taking place tomorrow, Friday, April 11th.

Arrival: Students should arrive by 7:30 AM directly at the Sports Complex.

Attire: Full House Colors (PE Kit) and appropriate running shoes.

Essentials: Please ensure your child has a labeled water bottle and extra sunscreen.

Early Dismissal: Please note that all students will be dismissed at 1:30 PM following the trophy ceremony. There will be no after-school clubs tomorrow.

We look forward to seeing you there to cheer on our athletes!

Best regards,

The Sports Department
EduFlow Academy`;

    try {
        await db.connect();
        
        // 1. Get recipients (Lecturers and HODs)
        const res = await db.query("SELECT id, email, name FROM \"User\" WHERE role IN ('LECTURER', 'HOD') AND \"isActive\" = true;");
        const recipients = res.rows;
        
        console.log(`📡 Found ${recipients.length} recipients. Starting broadcast...`);

        for (const user of recipients) {
            console.log(`   ➤ Sending to ${user.name} (${user.email})...`);
            
            // 2. Create DB Notification
            await db.query("INSERT INTO \"Notification\" (\"userId\", \"message\", \"createdAt\") VALUES ($1, $2, NOW());", [user.id, message]);
            
            // 3. Send Resend Email (Option A/B supported)
            try {
                const { data, error } = await resend.emails.send({
                    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                    to: user.email,
                    subject: subject,
                    text: message,
                    html: `<div style="font-family: sans-serif; white-space: pre-wrap; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br/>')}</div>`
                });
                
                if (error) {
                    console.error(`      ❌ Resend Error for ${user.email}:`, error.message);
                } else {
                    console.log(`      ✅ Email Delivered (ID: ${data.id})`);
                }
            } catch (emailErr) {
                console.error(`      ❌ Fatal Email Error for ${user.email}:`, emailErr.message);
            }
        }
        
        console.log("\n✨ BROADCAST COMPLETED.");
    } catch (err) {
        console.error("❌ BROADCAST FAILED:", err);
    } finally {
        await db.end();
    }
}

broadcastTest();
