import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import workoutImage from "../assets/workout.jpg";
import { BsArrowRight } from "react-icons/bs";
import GymDetails from "./GymDetails";
import { useAuth } from "../context/AuthContext";

const GymTracker = ({ headerHeight }) => {
  const { scrollYProgress } = useScroll();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldRevealImage, setShouldRevealImage] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGymDetails, setShowGymDetails] = useState(false);

  // Get last 7 days
  const getLastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate()
      });
    }
    return days;
  };

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.src = workoutImage;
    img.onload = () => setImageLoaded(true);
  }, []);

  // Handle scroll for image reveal
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const triggerPosition = window.innerHeight * 0.1;
      if (scrollPosition > triggerPosition) {
        setShouldRevealImage(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Text animations with adjusted trigger points
  const textOpacity = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.05, 0.15], [100, 0]);
  const textX = useTransform(scrollYProgress, [0.05, 0.15], [500, 0]);
  const textScale = useTransform(scrollYProgress, [0.05, 0.15], [0.8, 1]);

  // Trigger calendar animation when title animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCalendar(true);
    }, 2000); // 2 seconds after component mounts

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative w-full mt-48 flex flex-col md:flex-row justify-between"
      style={{ paddingTop: `${headerHeight}px` }}
    >
      {/* Image Container with Scroll-based Animation */}
      <motion.div
        className="relative w-full md:w-[35%] overflow-visible"
        style={{ 
          height: "80vh",
          position: "relative"
        }}
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat ml-24 rounded-3xl"
          style={{
            backgroundImage: `url(${workoutImage})`,
            backgroundPosition: '60% center',
            opacity: imageLoaded ? 1 : 0,
            height: "100%",
            width: "100%",
            maskImage: shouldRevealImage ? "none" : "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
            WebkitMaskImage: shouldRevealImage ? "none" : "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
            transition: "opacity 0.3s ease-out, mask-image 0.5s ease-out, -webkit-mask-image 0.5s ease-out"
          }}
        />
      </motion.div>

      {/* Right Content Side */}
      <div className="w-full md:w-[60%] text-white flex flex-col justify-start px-8 !ml-24">
        <motion.div
          className="flex flex-col"
          style={{
            opacity: textOpacity,
            x: textX,
            y: textY,
            scale: textScale,
          }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="text-[80px] font-semibold whitespace-nowrap mb-8 transition-colors duration-300 hover:text-[#d62e49] cursor-pointer"
            onClick={() => setShowGymDetails(true)}
          >
            GYM TRACKER
          </div>

          {/* Calendar Component */}
          <motion.div
            className="flex flex-col items-start mb-24"
            initial={{ opacity: 0, y: 100 }}
            animate={showCalendar ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ visibility: showCalendar ? 'visible' : 'hidden' }}
          >
            <div className="bg-white/10 rounded-2xl px-6 py-4 flex flex-col">
              <div className="flex gap-8 mb-2">
                {getLastSevenDays().map((day, index) => (
                  <div key={index} className="w-12 text-center">
                    <span className="text-gray-100 text-sm">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-8">
                {getLastSevenDays().map((day, index) => (
                  <div 
                    key={index} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      index === 6 ? 'bg-[#d62e49]' : 'bg-[#2a2f5c] hover:bg-[#d62e49]'
                    }`}
                  >
                    <span className="text-white font-medium">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-end w-full group">
            <div onClick={() => setShowGymDetails(true)} className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer group-hover:shadow-xl transition-all duration-500 relative overflow-hidden group-hover:scale-100 bg-white mr-16">
              <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
              <BsArrowRight className="text-[#d62e49] group-hover:text-white w-6 h-6 relative z-10 transition-colors duration-500" />
            </div>
          </div>
        </motion.div>
      </div>

      <GymDetails 
        show={showGymDetails} 
        onClose={() => setShowGymDetails(false)}
      />
    </section>
  );
};

export default GymTracker;
