import { NextResponse } from "next/server";
import { verifyToken } from "../../_utils/jwt";
import { writeFile } from "fs/promises";
import path from "path";
import { db } from "@/utils/prisma";
import fs from "fs";

// import prisma from "@/lib/prisma"; // if using Prisma

export async function POST(req: Request) {
  try {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    // 🔐 1. get token from header
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const payload: any = await verifyToken(token);

    const employee_id = payload.id; // 👈 from your JWT

    // 📦 2. parse form-data
    const formData = await req.formData();

    const file = formData.get("photo") as File;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;
    const address = formData.get("address") as string | null;
    const office_location_id = formData.get("office_location_id") as string | null;
    const distance = formData.get("distance") as string | null;

    if (!file || !latitude || !longitude || !address || !office_location_id || !distance) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    await writeFile(filePath, buffer);

    const db_res = await db.attendance_record.create({
      data: {
        employees: {
          connect: { id: employee_id },
        },
        latitude: Number(latitude),
        longitude: Number(longitude),
        address: String(address),
        selfie_url: `/uploads/${fileName}`,
        office_locations: {
          connect: { id: office_location_id },
        },
        distance: Number(distance),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const payload: any = await verifyToken(token);

    const employee_id = payload.id; // 👈 from your JWT

    // If using query params later
    // const { searchParams } = new URL(req.url);

    // 🔥 fetch only approved/valid attendance
    const records = await db.attendance_record.findMany({
      where: {
        employee_id,
      },
      orderBy: {
        submitted_at: "desc",
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        selfie_url: true,
        submitted_at: true,
        status: true,
      },
      take: 20, // pagination can be added later
    });

    console.log("Fetched attendance records:", records);

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("GET attendance error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance records",
      },
      { status: 500 }
    );
  }
}