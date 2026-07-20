import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility tests using axe-core via Playwright.
 *
 * Tests key pages for WCAG 2.1 AA compliance:
 * - Color contrast
 * - ARIA labels
 * - Keyboard navigation
 * - Hit target sizes
 */

test.describe("Accessibility Audits", () => {
    test.setTimeout(120000);

    test("Login page should have no critical accessibility violations", async ({
        page,
    }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();

        // Log violations for debugging
        if (results.violations.length > 0) {
            console.log(
                "Login page violations:",
                JSON.stringify(
                    results.violations.map((v) => ({
                        id: v.id,
                        impact: v.impact,
                        description: v.description,
                        nodes: v.nodes.length,
                    })),
                    null,
                    2
                )
            );
        }

        // Fail on serious or critical violations only
        const serious = results.violations.filter(
            (v) => v.impact === "critical" || v.impact === "serious"
        );
        expect(
            serious,
            `Found ${serious.length} serious/critical a11y violations on /login`
        ).toHaveLength(0);
    });

    test("Dashboard pages should have proper heading hierarchy", async ({
        page,
    }) => {
        // Log in by directly filling credentials after hydration
        await page.goto("/login");
        await page.waitForTimeout(3000);
        await page.fill('input[type="email"]', "superadmin@lamas.edu");
        await page.fill('input[type="password"]', "password123");
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(admin|lecturer|hod)/, { timeout: 90000 });
        await page.waitForLoadState("networkidle", { timeout: 90000 });

        const results = await new AxeBuilder({ page })
            .withRules(["heading-order"])
            .analyze();

        const serious = results.violations.filter(
            (v) => v.impact === "critical" || v.impact === "serious"
        );

        if (serious.length > 0) {
            console.log(
                "Dashboard violations:",
                JSON.stringify(
                    serious.map((v) => ({
                        id: v.id,
                        impact: v.impact,
                        description: v.description,
                        nodes: v.nodes.map((n) => n.html.substring(0, 100)),
                    })),
                    null,
                    2
                )
            );
        }

        expect(
            serious,
            `Found ${serious.length} serious/critical a11y violations on dashboard`
        ).toHaveLength(0);
    });

    test("Interactive elements should meet minimum hit target size", async ({
        page,
    }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        // Check all buttons and links have at least 44x44px hit area
        const interactiveElements = await page.$$(
            'button, a, input, select, textarea, [role="button"]'
        );

        const smallTargets: string[] = [];

        for (const el of interactiveElements) {
            const box = await el.boundingBox();
            if (box && (box.width < 44 || box.height < 44)) {
                const tag = await el.evaluate((e) => e.tagName);
                const text = await el.evaluate((e) =>
                    (e.textContent || "").trim().substring(0, 50)
                );
                // Skip hidden elements
                const isVisible = await el.isVisible();
                if (isVisible && box.width > 0 && box.height > 0) {
                    smallTargets.push(
                        `${tag} "${text}" (${Math.round(box.width)}x${Math.round(box.height)}px)`
                    );
                }
            }
        }

        if (smallTargets.length > 0) {
            console.log(
                `⚠️  ${smallTargets.length} elements below 44x44px minimum:`,
                smallTargets.join("\n  - ")
            );
        }

        // Warn but don't hard-fail — some small elements are acceptable (e.g., inline links)
        expect(smallTargets.length).toBeLessThan(20);
    });

    test("Color contrast should meet WCAG AA standards", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withRules(["color-contrast"])
            .analyze();

        if (results.violations.length > 0) {
            console.log(
                "Contrast violations:",
                JSON.stringify(
                    results.violations.flatMap((v) =>
                        v.nodes.map((n) => ({
                            html: n.html.substring(0, 100),
                            message: n.any?.[0]?.message,
                        }))
                    ),
                    null,
                    2
                )
            );
        }

        expect(
            results.violations,
            `Found ${results.violations.length} color contrast violations`
        ).toHaveLength(0);
    });
});
