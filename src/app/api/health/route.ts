import { initDb } from "@/lib/db";

export const runtime = 'nodejs';

export async function GET() {
  try {
    initDb();
    return Response.json({ status: "ok", message: "Database initialized" });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return Response.json(
      { status: "error", message: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
