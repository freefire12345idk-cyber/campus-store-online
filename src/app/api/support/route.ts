import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const contacts = await prisma.supportContact.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(contacts);
}
