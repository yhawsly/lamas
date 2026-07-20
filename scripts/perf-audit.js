/**
 * Performance audit script.
 *
 * Builds the production bundle, starts the server, runs Lighthouse,
 * and prints a summary. Can be used locally or in CI.
 *
 * Usage: node scripts/perf-audit.js
 */

const { execSync } = require("child_process");

function run(cmd, opts = {}) {
    console.log(`\n▸ ${cmd}`);
    try {
        execSync(cmd, { stdio: "inherit", ...opts });
    } catch {
        if (!opts.ignoreError) {
            console.error(`✖ Command failed: ${cmd}`);
            process.exit(1);
        }
    }
}

console.log("═══════════════════════════════════════");
console.log("  LAMAS Performance Audit");
console.log("═══════════════════════════════════════\n");

// Step 1: Build
console.log("📦 Step 1/3: Building production bundle...");
run("npm run build");

// Step 2: Run Lighthouse CI (if @lhci/cli is installed)
console.log("\n🔦 Step 2/3: Running Lighthouse audit...");
try {
    execSync("npx lhci --version", { stdio: "pipe" });
    run("npx lhci autorun");
} catch {
    console.log("   ℹ @lhci/cli not installed. Install with: npm install -D @lhci/cli");
    console.log("   Skipping Lighthouse audit.\n");
}

// Step 3: Bundle analysis summary
console.log("\n📊 Step 3/3: Bundle size analysis...");
console.log("   Run 'npm run analyze' to see the full bundle breakdown.\n");

console.log("═══════════════════════════════════════");
console.log("  Audit complete!");
console.log("═══════════════════════════════════════\n");
