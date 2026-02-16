import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const colleges = await prisma.college.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(colleges);
}

const addSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const data = addSchema.parse(body);
    const college = await prisma.college.create({
      data: { name: data.name, latitude: data.latitude, longitude: data.longitude },
    });
    return NextResponse.json(college);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to add college" }, { status: 500 });
  }
}
