import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"

interface ClientData {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string
  active?: boolean
}

export async function GET(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (active !== null && active !== undefined) {
      where.active = active === 'true'
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        receivables: {
          select: { id: true, amount: true, status: true, dueDate: true }
        },
        _count: {
          select: { receivables: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const count = await prisma.client.count({ where })

    // Add summary data to each client
    const clientsWithSummary = clients.map(client => ({
      ...client,
      totalReceivables: client.receivables.reduce((sum, r) => sum + r.amount, 0),
      overdueReceivables: client.receivables.filter(r => 
        r.status === 'pending' && new Date(r.dueDate) < new Date()
      ).length
    }))

    return NextResponse.json({ 
      success: true, 
      data: clientsWithSummary, 
      count,
      pagination: { limit, offset, total: count }
    })
  } catch (error: any) {
    console.error('GET /api/clients error:', error)
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

    const body: ClientData = await req.json()
    
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    if (body.email) {
      const existingClient = await prisma.client.findFirst({
        where: { email: body.email }
      })
      
      if (existingClient) {
        return NextResponse.json(
          { success: false, error: "Client with this email already exists" },
          { status: 409 }
        )
      }
    }

    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        notes: body.notes || null,
        active: body.active !== undefined ? body.active : true
      },
      include: {
        _count: { select: { receivables: true } }
      }
    })

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/clients error:', error)
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

    const body: ClientData & { id: string } = await req.json()
    
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const existing = await prisma.client.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    // Check email uniqueness if changed
    if (body.email && body.email !== existing.email) {
      const existingEmail = await prisma.client.findFirst({
        where: { email: body.email, id: { not: body.id } }
      })
      
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "Client with this email already exists" },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.client.update({
      where: { id: body.id },
      data: {
        name: body.name || existing.name,
        email: body.email !== undefined ? body.email : existing.email,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        company: body.company !== undefined ? body.company : existing.company,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        zipCode: body.zipCode !== undefined ? body.zipCode : existing.zipCode,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        active: body.active !== undefined ? body.active : existing.active
      },
      include: {
        _count: { select: { receivables: true } }
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('PUT /api/clients error:', error)
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

    const existing = await prisma.client.findUnique({ 
      where: { id },
      include: { _count: { select: { receivables: true } } }
    })
    
    if (!existing) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    if (existing._count.receivables > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete client with active receivables" },
        { status: 409 }
      )
    }

    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Client deleted successfully" })
  } catch (error: any) {
    console.error('DELETE /api/clients error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}
