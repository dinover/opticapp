import { executeQuery, executeInsert } from './query';

async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...');
    
    // Insertar productos de prueba
    const products = [
      {
        name: 'Lentes de Sol Ray-Ban',
        brand: 'Ray-Ban',
        model: 'Aviator',
        color: 'Dorado',
        size: '58mm',
        price: 25000,
        stock_quantity: 15,
        description: 'Lentes de sol clásicos con protección UV'
      },
      {
        name: 'Lentes Graduados Progresivos',
        brand: 'Essilor',
        model: 'Varilux',
        color: 'Transparente',
        size: '60mm',
        price: 45000,
        stock_quantity: 8,
        description: 'Lentes progresivos de alta calidad'
      },
      {
        name: 'Lentes de Contacto Mensuales',
        brand: 'Acuvue',
        model: 'Oasys',
        color: 'Azul',
        size: '14.0mm',
        price: 8000,
        stock_quantity: 50,
        description: 'Lentes de contacto blandas mensuales'
      },
      {
        name: 'Lentes de Sol Polarizados',
        brand: 'Oakley',
        model: 'Holbrook',
        color: 'Negro',
        size: '59mm',
        price: 35000,
        stock_quantity: 12,
        description: 'Lentes polarizados para deportes'
      },
      {
        name: 'Lentes Bifocales',
        brand: 'Zeiss',
        model: 'Bifocal',
        color: 'Transparente',
        size: '58mm',
        price: 28000,
        stock_quantity: 10,
        description: 'Lentes bifocales para presbicia'
      }
    ];

    console.log('📦 Inserting products...');
    for (const product of products) {
      await executeInsert(`
        INSERT INTO products (optic_id, name, brand, model, color, size, price, stock_quantity, description)
        VALUES (12, $1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        product.name,
        product.brand,
        product.model,
        product.color,
        product.size,
        product.price,
        product.stock_quantity,
        product.description
      ]);
    }

    // Insertar clientes de prueba
    const clients = [
      {
        first_name: 'Juan',
        last_name: 'Pérez',
        dni: '12345678',
        phone: '011-1234-5678',
        email: 'juan.perez@email.com',
        notes: 'Cliente frecuente, prefiere lentes progresivos'
      },
      {
        first_name: 'María',
        last_name: 'García',
        dni: '87654321',
        phone: '011-8765-4321',
        email: 'maria.garcia@email.com',
        notes: 'Alérgica a ciertos materiales de lentes'
      },
      {
        first_name: 'Carlos',
        last_name: 'López',
        dni: '11223344',
        phone: '011-1122-3344',
        email: 'carlos.lopez@email.com',
        notes: 'Practica deportes, necesita lentes resistentes'
      },
      {
        first_name: 'Ana',
        last_name: 'Martínez',
        dni: '44332211',
        phone: '011-4433-2211',
        email: 'ana.martinez@email.com',
        notes: 'Trabaja en computadora, necesita protección azul'
      },
      {
        first_name: 'Roberto',
        last_name: 'Fernández',
        dni: '55667788',
        phone: '011-5566-7788',
        email: 'roberto.fernandez@email.com',
        notes: 'Conductor profesional, necesita lentes de sol'
      }
    ];

    console.log('👥 Inserting clients...');
    for (const client of clients) {
      await executeInsert(`
        INSERT INTO clients (optic_id, first_name, last_name, dni, phone, email, notes)
        VALUES (12, $1, $2, $3, $4, $5, $6)
      `, [
        client.first_name,
        client.last_name,
        client.dni,
        client.phone,
        client.email,
        client.notes
      ]);
    }

    // Insertar algunas ventas de prueba usando la estructura antigua
    console.log('🛒 Inserting sample sales...');
    
    // Venta 1: Múltiples productos (usando estructura antigua)
    const sale1 = await executeInsert(`
      INSERT INTO sales (optic_id, client_id, product_id, quantity, total_price, sale_date, notes, total_amount)
      VALUES (12, 1, 1, 1, 25000, '2025-08-07T10:00:00Z', 'Venta con graduación', 25000)
    `);

    // Venta 2: Producto con graduación
    const sale2 = await executeInsert(`
      INSERT INTO sales (optic_id, client_id, product_id, quantity, total_price, sale_date, notes, total_amount, od_esf, od_cil, od_eje, oi_esf, oi_cil, oi_eje)
      VALUES (12, 2, 2, 1, 45000, '2025-08-07T14:30:00Z', 'Lentes progresivos', 45000, -1.5, -0.75, 180, -1.25, -0.5, 175)
    `);

    // Venta 3: Cliente no registrado
    const sale3 = await executeInsert(`
      INSERT INTO sales (optic_id, unregistered_client_name, product_id, quantity, total_price, sale_date, notes, total_amount)
      VALUES (12, 'Cliente Ocasional', 4, 1, 35000, '2025-08-07T16:45:00Z', 'Venta a cliente no registrado', 35000)
    `);

    // Venta 4: Producto no registrado
    const sale4 = await executeInsert(`
      INSERT INTO sales (optic_id, client_id, unregistered_product_name, quantity, total_price, sale_date, notes, total_amount)
      VALUES (12, 3, 'Estuche para lentes', 1, 5000, '2025-08-07T18:00:00Z', 'Accesorio adicional', 5000)
    `);

    console.log('✅ Test data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${products.length} products inserted`);
    console.log(`   - ${clients.length} clients inserted`);
    console.log(`   - 4 sample sales inserted`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedTestData();
}

export { seedTestData };
