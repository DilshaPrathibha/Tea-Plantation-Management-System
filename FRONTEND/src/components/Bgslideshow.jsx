// BackgroundSlideshow.js
import React, { useEffect, useState } from 'react';
import { Sweet, Toast } from '@/utils/sweet';

const images = [
  '/banner-sp-1024x576.jpg',
  '/jerry-kavan-i9eaAR4dWi8-unsplash.jpg',
  '/pexels-andrea-zanenga-9756792-6120446.jpg',
];

const BackgroundSlideshow = () => {
  const [index, setIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  // Preload images to prevent loading delays during transitions
  useEffect(() => {
    const preloadImages = () => {
      images.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, src]));
        };
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`);
          setFailedImages(prev => new Set([...prev, src]));
        };
        img.src = src;
      });
    };
    preloadImages();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Get available images (excluding failed ones)
  const availableImages = images.filter(img => !failedImages.has(img));
  const currentImage = availableImages[index % availableImages.length] || availableImages[0];

  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
      {availableImages.length > 0 ? (
        availableImages.map((img, i) => (
          <img
            key={img}
            src={img}
            alt=""
            className={`absolute w-full h-full object-cover transition-all duration-1000 ease-in-out ${
              img === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{
              willChange: 'opacity, transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)'
            }}
            onError={(e) => {
              console.error(`Failed to load image: ${img}`);
              setFailedImages(prev => new Set([...prev, img]));
              e.target.style.display = 'none';
            }}
            onLoad={() => {
              setLoadedImages(prev => new Set([...prev, img]));
            }}
          />
        ))
      ) : (
        // Fallback gradient background if no images load
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-green-900 to-teal-800"></div>
      )}
      <div className="absolute inset-0 bg-black/30"></div>
    </div>
  );
};

export default BackgroundSlideshow;