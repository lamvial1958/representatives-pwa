import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('?? Criando dados de exemplo...')

  // Criar clientes exemplo
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Jo?o Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1234',
        company: 'Silva & Cia',
        city: 'S?o Paulo',
        state: 'SP'
      }
    }),
    prisma.client.create({
      data: {
        name: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        phone: '(21) 98888-5678',
        company: 'Santos Ltda',
        city: 'Rio de Janeiro',
        state: 'RJ'
      }
    }),
    prisma.client.create({
      data: {
        name: 'Pedro Costa',
        email: 'pedro@costa.com.br',
        phone: '(31) 97777-9012',
        company: 'Costa Neg?cios',
        city: 'Belo Horizonte',
        state: 'MG'
      }
    })
  ])

  console.log(`? ${clients.length} clientes criados`)

  // Criar receivables
  const receivables = await Promise.all([
    prisma.receivable.create({
      data: {
        clientId: clients[0].id,
        customerName: clients[0].name,
        amount: 5000.00,
        dueDate: new Date('2025-01-15'),
        status: 'pending',
        description: 'Venda de produtos'
      }
    }),
    prisma.receivable.create({
      data: {
        clientId: clients[1].id,
        customerName: clients[1].name,
        amount: 3500.50,
        dueDate: new Date('2024-12-10'),
        status: 'overdue',
        description: 'Servi?os prestados'
      }
    }),
    prisma.receivable.create({
      data: {
        clientId: clients[2].id,
        customerName: clients[2].name,
        amount: 8200.75,
        dueDate: new Date('2025-02-01'),
        status: 'pending',
        description: 'Projeto especial'
      }
    })
  ])

  console.log(`? ${receivables.length} receivables criados`)

  // Criar goals
  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        title: 'Meta Mensal Janeiro',
        periodType: 'monthly',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        targetAmount: 25000.00,
        targetSales: 30,
        currentAmount: 8500.00,
        currentSales: 12,
        status: 'active',
        description: 'Meta de vendas para janeiro'
      }
    }),
    prisma.goal.create({
      data: {
        title: 'Meta Trimestral Q1',
        periodType: 'quarterly',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-03-31'),
        targetAmount: 75000.00,
        targetSales: 100,
        currentAmount: 15200.00,
        currentSales: 18,
        status: 'active',
        description: 'Meta trimestral primeiro quarter'
      }
    })
  ])

  console.log(`? ${goals.length} goals criados`)
  console.log('?? Seed completo!')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
