import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = "w-12 h-12 object-cover rounded-lg",
  fallbackIcon = <Package className="w-6 h-6 text-gray-400" />,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Si no hay src o hubo error, mostrar fallback
  if (!src || imageError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ProductImage;
