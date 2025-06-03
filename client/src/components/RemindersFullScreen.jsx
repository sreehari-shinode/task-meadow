import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsArrowRight } from 'react-icons/bs';

const blue = '#1d2145';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.4 } }
};

const RemindersFullScreen = ({ show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={overlayVariants}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
          style={{ background: blue }}
        >
          <h1 className="text-5xl font-bold text-white mb-8">Reminders Full Screen</h1>
          <p className="text-white/80 text-xl">This is a placeholder for the full reminders page.</p>
          <div className="group fixed top-10 right-10 z-50">
            <div
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer group-hover:shadow-xl transition-all duration-500 relative overflow-hidden bg-white"
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
              <BsArrowRight className="text-[#d62e49] group-hover:text-white w-6 h-6 relative z-10 transition-colors duration-500" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RemindersFullScreen; 