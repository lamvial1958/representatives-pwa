import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DB_ENABLED } from "@/lib/config"

export async function GET() {
  try {
    if (!DB_ENABLED) {
      return NextResponse.json({
        success: true,
        data: {
          totalClients: 0,
          totalReceivables: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          activeGoals: 0,
          overdueReceivables: 0,
          completedGoals: 0,
          avgGoalProgress: 0,
          recentSales: [],
          topClients: [],
          monthlyStats: [],
          goalProgress: [],
          receivablesByStatus: [],
          commissionAnalysis: {
            thisMonth: 0,
            lastMonth: 0,
            growth: 0,
            pending: 0,
            paid: 0
          }
        }
      })
    }

    // Executar todas as queries em paralelo para performance
    const [
      totalClients,
      activeClients,
      totalReceivables,
      receivablesByStatus,
      goals,
      recentReceivables,
      topClientsByReceivables,
      monthlyReceivables
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count(),
      
      // Clientes ativos
      prisma.client.count({ where: { active: true } }),
      
      // Total de receivables
      prisma.receivable.count(),
      
      // Receivables por status
      prisma.receivable.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { amount: true }
      }),
      
      // Goals e progresso
      prisma.goal.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          title: true,
          targetAmount: true,
          currentAmount: true,
          targetSales: true,
          currentSales: true,
          periodEnd: true,
          status: true
        }
      }),
      
      // Recent receivables (últimas 10)
      prisma.receivable.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, company: true } }
        }
      }),
      
      // Top 5 clientes por valor de receivables
      prisma.client.findMany({
        include: {
          receivables: {
            where: { status: { in: ['pending', 'overdue'] } },
            select: { amount: true }
          },
          _count: { select: { receivables: true } }
        },
        orderBy: {
          receivables: { _count: 'desc' }
        },
        take: 5
      }),
      
      // Stats mensais (últimos 6 meses)
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as count,
          SUM(amount) as total,
          AVG(amount) as average
        FROM receivables 
        WHERE createdAt >= datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month DESC
        LIMIT 6
      `
    ])

    // Calcular métricas derivadas
    const totalRevenue = receivablesByStatus
      .filter(r => ['received', 'pending', 'overdue'].includes(r.status))
      .reduce((sum, r) => sum + (r._sum.amount || 0), 0)

    // CORRIGIDO: Calcular comissões (10% do total de vendas)
    const COMMISSION_RATE = 0.10; // 10% de comissão
    const totalSales = receivablesByStatus
      .reduce((sum, r) => sum + (r._sum.amount || 0), 0)
    const totalCommissions = Math.round(totalSales * COMMISSION_RATE * 100) / 100

    // Calcular comissões mensais para análise
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const thisMonthSales = await prisma.receivable.aggregate({
      where: {
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      },
      _sum: { amount: true }
    })

    const lastMonthSales = await prisma.receivable.aggregate({
      where: {
        createdAt: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        }
      },
      _sum: { amount: true }
    })

    const thisMonthCommissions = Math.round((thisMonthSales._sum.amount || 0) * COMMISSION_RATE * 100) / 100
    const lastMonthCommissions = Math.round((lastMonthSales._sum.amount || 0) * COMMISSION_RATE * 100) / 100
    
    const commissionGrowth = lastMonthCommissions > 0
      ? ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) * 100
      : thisMonthCommissions > 0 
        ? 100  // Crescimento de R$ 0 para valor positivo = +100%
        : 0    // Ambos zero = sem crescimento

    const pendingCommissions = receivablesByStatus
      .filter(r => ['pending', 'overdue'].includes(r.status))
      .reduce((sum, r) => sum + (r._sum.amount || 0), 0) * COMMISSION_RATE

    const paidCommissions = receivablesByStatus
      .filter(r => ['received', 'pending', 'overdue'].includes(r.status))
      .reduce((sum, r) => sum + (r._sum.amount || 0), 0) * COMMISSION_RATE

    const overdueCount = receivablesByStatus
      .find(r => r.status === 'overdue')?._count.status || 0

    const activeGoals = goals.length
    const completedGoalsCount = await prisma.goal.count({ 
      where: { status: 'completed' } 
    })

    const avgGoalProgress = goals.length > 0 
      ? goals.reduce((sum, goal) => {
          const progress = goal.targetAmount > 0 
            ? (goal.currentAmount / goal.targetAmount) * 100 
            : 0
          return sum + Math.min(progress, 100)
        }, 0) / goals.length
      : 0

    // Preparar dados para o frontend
    const topClients = topClientsByReceivables.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company,
      totalPurchases: client.receivables.reduce((sum, r) => sum + r.amount, 0),
      lastPurchase: client.receivables.length > 0 ? client.receivables[0].createdAt : client.createdAt
    }))

    const goalProgress = goals.map(goal => ({
      ...goal,
      progressPercentage: goal.targetAmount > 0 
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0,
      salesProgressPercentage: goal.targetSales 
        ? Math.min(100, (goal.currentSales / goal.targetSales) * 100)
        : null,
      daysRemaining: Math.max(0, Math.ceil(
        (new Date(goal.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    }))

    const receivableStatusSummary = receivablesByStatus.map(item => ({
      status: item.status,
      count: item._count.status,
      total: item._sum.amount || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        // KPIs principais
        totalClients,
        activeClients,
        totalReceivables,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        totalSales: Math.round(totalSales * 100) / 100,
        activeGoals,
        overdueReceivables: overdueCount,
        completedGoals: completedGoalsCount,
        avgGoalProgress: Math.round(avgGoalProgress * 10) / 10,
        
        // Análise de comissões
        commissionAnalysis: {
          thisMonth: Math.round(thisMonthCommissions * 100) / 100,
          lastMonth: Math.round(lastMonthCommissions * 100) / 100,
          growth: Math.round(commissionGrowth * 10) / 10,
          pending: Math.round(pendingCommissions * 100) / 100,
          paid: Math.round(paidCommissions * 100) / 100
        },
        
        // Listas para widgets
        recentSales: recentReceivables.map(r => ({
          id: r.id,
          customerName: r.customerName,
          client: r.client,
          amount: r.amount,
          dueDate: r.dueDate,
          status: r.status,
          createdAt: r.createdAt,
          commission: r.amount * (r.commissionRate || 0.05)  // ← NOVA LINHA
        })),
        
        topClients,
        goalProgress,
        receivablesByStatus: receivableStatusSummary,
        
        // Dados para gráficos
        monthlyStats: Array.isArray(monthlyReceivables) 
          ? monthlyReceivables.map((stat: any) => ({
              month: stat.month,
              count: Number(stat.count),
              total: Number(stat.total) || 0,
              average: Number(stat.average) || 0
            }))
          : [],
          
        // Timestamp para cache
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



