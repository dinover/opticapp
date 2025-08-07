import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
});

// Configurar almacenamiento de Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'opticapp',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  } as any,
});

// Configurar multer con Cloudinary
const upload = multer({ storage });

// Función para eliminar imagen de Cloudinary
const deleteImage = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Función para obtener URL de imagen
const getImageUrl = (publicId: string) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill' }
    ]
  });
};

export { upload, deleteImage, getImageUrl, cloudinary };
