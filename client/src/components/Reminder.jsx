import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { BsArrowRight } from "react-icons/bs";
import workoutImage from "../assets/workout.jpg";
import RemindersFullScreen from './RemindersFullScreen';

const Reminders = ({ headerHeight }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldRevealImage, setShouldRevealImage] = useState(false);
  const [showRemindersFullScreen, setShowRemindersFullScreen] = useState(false);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.src = workoutImage;
    img.onload = () => setImageLoaded(true);
  }, []);

  // Handle scroll for image reveal - adjusted to trigger earlier
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const triggerPosition = window.innerHeight * 0.05; // Reduced to 5% for earlier reveal
      if (scrollPosition > triggerPosition) {
        setShouldRevealImage(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Text animations with adjusted trigger points and spacing
  const textOpacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.6, 0.7], [-100, 0]);
  const textX = useTransform(scrollYProgress, [0.6, 0.7], [-500, 0]);
  const textScale = useTransform(scrollYProgress, [0.6, 0.7], [0.8, 1]);

  const reminders = [
    "Meeting with Trainer",
    "Cardio Day",
    "Leg Workout",
    "Full Body Stretch",
    "Yoga Session",
  ];

  const handleWheel = (e) => {
    e.preventDefault();
    if (scrollRef.current) {
      const scrollAmount = e.deltaY > 0 ? 1 : -1;
      setCurrentIndex((prevIndex) => {
        let newIndex = prevIndex + scrollAmount;
        if (newIndex < 0) newIndex = reminders.length - 1;
        if (newIndex >= reminders.length) newIndex = 0;
        return newIndex;
      });
    }
  };

  return (
    <section 
      className="relative mt-60 w-full flex flex-col md:flex-row-reverse px-24 justify-between"
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mr-24 rounded-3xl"
          style={{
            backgroundImage: `url(${workoutImage})`,
            backgroundPosition: '40% center',
            opacity: imageLoaded ? 1 : 0,
            height: "100%",
            width: "100%",
            maskImage: shouldRevealImage ? "none" : "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
            WebkitMaskImage: shouldRevealImage ? "none" : "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
            transition: "opacity 0.3s ease-out, mask-image 0.5s ease-out, -webkit-mask-image 0.5s ease-out"
          }}
        />
      </motion.div>

      {/* Left Content Side */}
      <div className="w-full md:w-[60%] text-white flex flex-col justify-start px-8 mr-auto">
        <motion.div
          className="flex flex-col"
          style={{
            opacity: textOpacity,
            x: textX,
            y: textY,
            scale: textScale,
            filter: `blur(${useTransform(textOpacity, [0, 1], [10, 0])}px)`
          }}
        >
          <div 
            className="text-[80px] font-semibold whitespace-nowrap mb-24 transition-colors duration-300 hover:text-[#d62e49] cursor-pointer"
            onClick={() => setShowRemindersFullScreen(true)}
          >
            REMINDERS
          </div>
          <div className="flex items-center justify-start w-full">
            <div
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-500 relative overflow-hidden group bg-white ml-16"
              onClick={() => setShowRemindersFullScreen(true)}
            >
              <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
              <BsArrowRight className="text-[#d62e49] group-hover:text-white w-6 h-6 relative z-10 transition-colors duration-500" />
            </div>
          </div>
        </motion.div>

        {/* Reminders List */}
        <div className="bg-[#11113a] p-4 rounded-2xl shadow-lg overflow-hidden relative mt-8">
          <h3 className="text-2xl font-semibold mb-4">Upcoming Tasks</h3>
          <div
            className="relative overflow-hidden max-h-[320px] cursor-pointer"
            ref={scrollRef}
            onWheel={handleWheel}
          >
            <div
              id="scrollableCards"
              className="flex flex-col transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateY(-${currentIndex * 80}px)`,
              }}
            >
              {reminders.map((reminder, index) => (
                <div
                  key={index}
                  className={`bg-[#1a1a40] p-4 rounded-xl shadow transition-transform duration-200 ${index === currentIndex ? "w-full" : "w-4/5"}`}
                  style={{
                    opacity: index === currentIndex ? 1 : 0.3,
                    transform: `scale(${index === currentIndex ? 1 : 0.9})`,
                    marginTop: index === currentIndex ? "0" : "20px",
                    marginBottom: index === currentIndex ? "0" : "20px",
                  }}
                >
                  {reminder}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Conditionally render RemindersFullScreen overlay (using AnimatePresence) */}
      <AnimatePresence>
        {showRemindersFullScreen && (
          <RemindersFullScreen onClose={() => setShowRemindersFullScreen(false)} />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Reminders;
