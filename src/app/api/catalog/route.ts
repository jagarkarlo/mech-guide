import { NextResponse } from "next/server";
import { brands, cars } from "@/data/catalog";

export function GET() {
  return NextResponse.json({ brands, cars });
}
