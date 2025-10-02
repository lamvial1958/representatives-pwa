// scripts/migrate-data.js - Script para migrar dados SQLite → PostgreSQL

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Iniciando migração SQLite → PostgreSQL...');
  
  try {
    // Conectar ao SQLite atual
    const sqliteDb = new Database(path.join(process.cwd(), 'data', 'database.sqlite'));
    
    console.log('📥 Exportando dados do SQLite...');
    
    // Exportar customers
    const customers = sqliteDb.prepare('SELECT * FROM customers WHERE active = 1').all();
    console.log(`📊 Encontrados ${customers.length} clientes`);
    
    // Exportar sales
    const sales = sqliteDb.prepare('SELECT * FROM sales WHERE active = 1').all();
    console.log(`📊 Encontradas ${sales.length} vendas`);
    
    console.log('📤 Importando para PostgreSQL...');
    
    // Migrar customers
    for (const customer of customers) {
      await prisma.customer.create({
        data: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.postal_code,
          notes: customer.notes,
          tipo_pessoa: customer.tipo_pessoa === 'fisica' ? 'FISICA' : 'JURIDICA',
          cpf: customer.cpf,
          cnpj: customer.cnpj,
          razao_social: customer.razao_social,
          inscricao_estadual: customer.inscricao_estadual,
          active: Boolean(customer.active),
          created_at: new Date(customer.created_at || Date.now()),
          updated_at: new Date(customer.updated_at || Date.now())
        }
      });
    }
    
    console.log('✅ Customers migrados com sucesso');
    
    // Migrar sales
    for (const sale of sales) {
      let status = 'PENDENTE';
      if (sale.status === 'Pago') status = 'PAGO';
      if (sale.status === 'Cancelado') status = 'CANCELADO';
      
      await prisma.sale.create({
        data: {
          customer_id: sale.customer_id,
          sale_date: sale.sale_date,
          product_service: sale.product_service,
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          commission_rate: sale.commission_rate,
          commission_amount: sale.commission_amount,
          payment_method: sale.payment_method,
          status: status,
          notes: sale.notes,
          active: Boolean(sale.active),
          created_at: new Date(sale.created_at || Date.now()),
          updated_at: new Date(sale.updated_at || Date.now())
        }
      });
    }
    
    console.log('✅ Sales migradas com sucesso');
    
    // Verificar dados migrados
    const customerCount = await prisma.customer.count();
    const salesCount = await prisma.sale.count();
    
    console.log(`🎊 Migração concluída:`);
    console.log(`   📊 ${customerCount} clientes migrados`);
    console.log(`   💰 ${salesCount} vendas migradas`);
    
    sqliteDb.close();
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
