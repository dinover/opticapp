import { executeQuery } from './query';
import { cloudinary } from '../config/cloudinary';
import fs from 'fs';
import path from 'path';

async function migrateImagesToCloudinary() {
  try {
    console.log('🔄 Starting image migration to Cloudinary...');
    
    // Obtener todos los productos con imágenes locales
    const products = await executeQuery('SELECT id, image_url FROM products WHERE image_url IS NOT NULL AND image_url LIKE \'/uploads/%\'');
    
    console.log(`📦 Found ${products.rows.length} products with local images`);
    
    for (const product of products.rows) {
      try {
        const imagePath = path.join(__dirname, '../../uploads', path.basename(product.image_url));
        
        // Verificar si el archivo existe
        if (!fs.existsSync(imagePath)) {
          console.log(`⚠️  File not found: ${imagePath}`);
          continue;
        }
        
        // Subir a Cloudinary
        const result = await cloudinary.uploader.upload(imagePath, {
          folder: 'opticapp',
          public_id: `product_${product.id}_${Date.now()}`
        });
        
        // Actualizar la base de datos con la nueva URL
        await executeQuery(
          'UPDATE products SET image_url = $1 WHERE id = $2',
          [result.secure_url, product.id]
        );
        
        console.log(`✅ Migrated product ${product.id}: ${result.secure_url}`);
        
        // Eliminar archivo local (opcional)
        // fs.unlinkSync(imagePath);
        
      } catch (error) {
        console.error(`❌ Error migrating product ${product.id}:`, error);
      }
    }
    
    console.log('🎉 Image migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateImagesToCloudinary();
}

export { migrateImagesToCloudinary };
