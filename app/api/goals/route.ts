import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"

interface GoalData {
  title: string
  periodType: string
  periodStart: string
  periodEnd: string
  targetAmount: number
  targetSales?: number
  description?: string
  notes?: string
  status?: string
}

export async function GET(req: NextRequest) {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const periodType = searchParams.get('periodType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status !== 'all') where.status = status
    if (periodType) where.periodType = periodType

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const count = await prisma.goal.count({ where })

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progressPercentage: goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0,
      salesProgressPercentage: goal.targetSales ? Math.min(100, (goal.currentSales / goal.targetSales) * 100) : null
    }))

    return NextResponse.json({ 
      success: true, 
      data: goalsWithProgress, 
      count,
      pagination: { limit, offset, total: count }
    })
  } catch (error: any) {
    console.error('GET /api/goals error:', error)
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

    const body: GoalData = await req.json()
    
    // Basic validation
    if (!body.title || !body.periodType || !body.periodStart || !body.periodEnd || !body.targetAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, periodType, periodStart, periodEnd, targetAmount" },
        { status: 400 }
      )
    }

    if (body.targetAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Target amount must be greater than 0" },
        { status: 400 }
      )
    }

    const startDate = new Date(body.periodStart)
    const endDate = new Date(body.periodEnd)
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: "End date must be after start date" },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        title: body.title,
        periodType: body.periodType,
        periodStart: startDate,
        periodEnd: endDate,
        targetAmount: body.targetAmount,
        targetSales: body.targetSales || null,
        description: body.description || null,
        notes: body.notes || null,
        status: body.status || 'active'
      }
    })

    return NextResponse.json({ success: true, data: goal }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/goals error:', error)
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

    const body: GoalData & { id: string; currentAmount?: number; currentSales?: number } = await req.json()
    
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const existing = await prisma.goal.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 })
    }

    const updated = await prisma.goal.update({
      where: { id: body.id },
      data: {
        title: body.title || existing.title,
        periodType: body.periodType || existing.periodType,
        periodStart: body.periodStart ? new Date(body.periodStart) : existing.periodStart,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : existing.periodEnd,
        targetAmount: body.targetAmount !== undefined ? body.targetAmount : existing.targetAmount,
        targetSales: body.targetSales !== undefined ? body.targetSales : existing.targetSales,
        currentAmount: body.currentAmount !== undefined ? body.currentAmount : existing.currentAmount,
        currentSales: body.currentSales !== undefined ? body.currentSales : existing.currentSales,
        status: body.status || existing.status,
        description: body.description !== undefined ? body.description : existing.description,
        notes: body.notes !== undefined ? body.notes : existing.notes
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('PUT /api/goals error:', error)
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

    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 })
    }

    await prisma.goal.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Goal deleted successfully" })
  } catch (error: any) {
    console.error('DELETE /api/goals error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" }, 
      { status: 500 }
    )
  }
}
