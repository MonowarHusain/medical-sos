import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL;
  const hasDatabaseUrl = Boolean(rawUrl && rawUrl.trim().length > 0);
  const trimmedUrl = (rawUrl || "").trim();
  const hasSurroundingQuotes =
    (trimmedUrl.startsWith('"') && trimmedUrl.endsWith('"')) ||
    (trimmedUrl.startsWith("'") && trimmedUrl.endsWith("'"));
  const cleanUrl = hasSurroundingQuotes ? trimmedUrl.slice(1, -1).trim() : trimmedUrl;
  const startsWithPostgres =
    cleanUrl.startsWith("postgresql://") || cleanUrl.startsWith("postgres://");

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      dbConnected: true,
      userCount,
      hasDatabaseUrl,
      hasSurroundingQuotes,
      startsWithPostgres,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    console.error("Health check DB connection failed:", err);
    return NextResponse.json(
      {
        ok: false,
        dbConnected: false,
        hasDatabaseUrl,
        hasSurroundingQuotes,
        startsWithPostgres,
        error: error?.message || "Failed to query database",
        code: error?.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
