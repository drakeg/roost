import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function healthResponse(status, httpStatus) {
  return NextResponse.json(
    { status },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return healthResponse("ok", 200);
  } catch {
    return healthResponse("unavailable", 503);
  }
}
