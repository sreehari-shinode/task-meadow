import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import "./ImageCarousel.css";

import img1 from "../assets/bg.jpg";
import img2 from "../assets/workout.jpg";
import img3 from "../assets/bg.jpg";

const images = [img1, img2, img3, img1, img2, img3, img1, img2, img3];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = images.length;
  const { scrollYProgress } = useScroll();

  // Scroll-based animations - adjusted to trigger much later
  const y = useTransform(scrollYProgress, [0.3, 0.4], [800, 0]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.3], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.2, 0.3], [0.6, 1]);
  const rotateX = useTransform(scrollYProgress, [0.2, 0.3], [60, 15]);
  const rotateY = useTransform(scrollYProgress, [0.2, 0.3], [-45, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 3000);

    return () => clearInterval(interval);
  }, [total]);

  const getStyle = (index) => {
    const position = (index - currentIndex + total) % total;
    const angle = (position * (360 / total)) % 360;
    const radius = 500;
    
    // Calculate position in 3D space
    const x = Math.sin((angle * Math.PI) / 180) * radius;
    const z = Math.cos((angle * Math.PI) / 180) * radius;
    const rotateY = -angle;

    // Calculate opacity based on position
    const opacity = Math.abs(position) <= 2 ? 0.5 : 0.3;
    const activeOpacity = position === 0 ? 1 : opacity;

    // Add margin based on position
    const marginTop = position === 0 ? '30px' : 
                     position === 1 || position === total - 1 ? '20px' :
                     position === 2 || position === total - 2 ? '10px' : '0px';
    const marginBottom = position === 0 ? '0px' :
                        position === 1 || position === total - 1 ? '0px' :
                        position === 2 || position === total - 2 ? '0px' : '20px';

    return {
      transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg)`,
      opacity: activeOpacity,
      zIndex: position === 0 ? 2 : 1,
      transition: 'all 0.8s ease-in-out',
      marginTop,
      marginBottom
    };
  };

  return (
    <motion.div 
      className="slider-container flex items-center justify-center min-h-screen"
      style={{
        y,
        opacity,
        scale,
        rotateY,
        padding: "0"
      }}
    >
      <div className="slider">
        <motion.div 
          className="slider-track"
          style={{
            rotateX
          }}
        >
          {images.map((img, index) => (
            <div 
              key={index} 
              className="slider-item"
              style={getStyle(index)}
            >
              <div className="slider-item-inner">
                <img src={img} alt={`Slide ${index + 1}`} draggable={false} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ImageSlider;
