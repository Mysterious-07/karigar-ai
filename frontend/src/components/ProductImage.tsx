'use client';

import React, { useState } from 'react';
import { getImageUrl } from '@/lib/api';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => getImageUrl(src));

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc('/placeholder-art.jpg');
      }}
    />
  );
}
