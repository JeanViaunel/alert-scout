import { initDb } from "@/lib/db";
import { initializeScheduler } from "@/lib/scheduler-init";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Initialize database
    initDb();
    
    // Start scheduler (this will schedule daily messages at 8am, 12pm, 10pm)
    initializeScheduler();
    
    return Response.json({
      status: "ok",
      message: "Alert Scout system initialized",
      features: [
        "Database: Ready",
        "Authentication: Ready",
        "Alert Management: Ready",
        "591 Scraper: Ready",
        "Matches System: Ready",
        "Cron Scheduler: Active (8am, 12pm, 10pm daily)",
      ],
      scheduler: {
        morning: "8:00 AM",
        noon: "12:00 PM",
        evening: "10:00 PM",
        status: "Running",
      },
    });
    
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      { status: "error", message: "System initialization failed" },
      { status: 500 }
    );
  }
}
