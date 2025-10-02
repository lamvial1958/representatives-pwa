import { NextResponse } from "next/server"
import { DB_ENABLED } from "@/lib/config"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    if (DB_ENABLED) {
      // TODO: implementar query real quando necess?rio
      // const rows = await prisma.client.findMany({ orderBy: { createdAt: "desc" } })
      // return NextResponse.json({ success: true, data: rows, count: rows.length })
    }
    return NextResponse.json({ success: true, data: [], count: 0 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "POST disabled (no DB configured)" }, { status: 501 })
    }
    return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "PUT disabled (no DB configured)" }, { status: 501 })
    }
    return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "DELETE disabled (no DB configured)" }, { status: 501 })
    }
    return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Internal error" }, { status: 500 })
  }
}
