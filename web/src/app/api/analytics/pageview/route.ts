import { database } from "@/server/db";
import { handlePageview } from "@/server/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const { db } = database();
  return handlePageview(request, { db });
}
