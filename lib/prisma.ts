import { PrismaClient } from "@prisma/client";

function getCleanDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  url = url.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

const cleanUrl = getCleanDatabaseUrl();
if (cleanUrl) {
  process.env.DATABASE_URL = cleanUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: cleanUrl ? { db: { url: cleanUrl } } : undefined,
    log: ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
