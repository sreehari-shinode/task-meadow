import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Reminders = () => {
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => navigate('/reminders/full')}
        className="absolute right-4 top-4 text-white text-2xl bg-blue-700 rounded-full p-2 hover:bg-blue-800 transition-colors"
        aria-label="Go to full reminders"
      >
        <span>&rarr;</span>
      </button>
    </div>
  );
};

export default Reminders; 