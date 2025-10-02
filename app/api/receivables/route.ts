import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"

// Validation schema
interface ReceivableData {
  clientId: string
  customerName: string
  amount: number
  dueDate: string
  status?: string
  description?: string
  notes?: string
}

export async function GET(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status

    const receivables = await prisma.receivable.findMany({
      where,
      include: { client: { select: { id: true, name: true, email: true } } },
      orderBy: { dueDate: 'asc' },
      take: limit,
      skip: offset
    })

    const count = await prisma.receivable.count({ where })

    return NextResponse.json({ 
      success: true, 
      data: receivables, 
      count,
      pagination: { limit, offset, total: count }
    })
  } catch (error: any) {
    console.error('GET /api/receivables error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "Database not enabled" }, { status: 501 })
    }

    const body: ReceivableData = await req.json()
    
    // Basic validation
    if (!body.clientId || !body.customerName || !body.amount || !body.dueDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: clientId, customerName, amount, dueDate" },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Check if client exists
    const client = await prisma.client.findUnique({ where: { id: body.clientId } })
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      )
    }

    const receivable = await prisma.receivable.create({
      data: {
        clientId: body.clientId,
        customerName: body.customerName,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        status: body.status || 'pending',
        description: body.description || null,
        notes: body.notes || null
      },
      include: { client: { select: { id: true, name: true, email: true } } }
    })

    return NextResponse.json({ success: true, data: receivable }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/receivables error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "Database not enabled" }, { status: 501 })
    }

    const body: ReceivableData & { id: string } = await req.json()
    
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    // Check if exists
    const existing = await prisma.receivable.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Receivable not found" }, { status: 404 })
    }

    const updated = await prisma.receivable.update({
      where: { id: body.id },
      data: {
        customerName: body.customerName || existing.customerName,
        amount: body.amount || existing.amount,
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
        status: body.status || existing.status,
        description: body.description !== undefined ? body.description : existing.description,
        notes: body.notes !== undefined ? body.notes : existing.notes
      },
      include: { client: { select: { id: true, name: true, email: true } } }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('PUT /api/receivables error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: false, error: "Database not enabled" }, { status: 501 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const existing = await prisma.receivable.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Receivable not found" }, { status: 404 })
    }

    await prisma.receivable.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Receivable deleted successfully" })
  } catch (error: any) {
    console.error('DELETE /api/receivables error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}
