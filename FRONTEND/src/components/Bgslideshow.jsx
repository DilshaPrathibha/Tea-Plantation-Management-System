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

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0">
      {images.map((img, i) => (
        <img
          key={img}
          src={img}
          alt=""
          className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            console.error(`Failed to load image: ${img}`);
            e.target.style.display = 'none';
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/30"></div>
    </div>
  );
};

export default BackgroundSlideshow;