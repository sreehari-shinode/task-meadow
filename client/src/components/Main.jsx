import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StickyHeader from "./Header";
import GymTracker from "./GymTracker";
import ImageCarousel from "./ImageCarousel";
import Reminders from "./Reminder";
import AuthModal from "./AuthModal";
import GymDetails from "./GymDetails";
import LoadingScreen from "./LoadingScreen";
import RemindersFullScreen from "./RemindersFullScreen";

const Main = ({ headerHeight, setHeaderHeight, user, contentLoaded }) => {
  if (!contentLoaded) {
    return <LoadingScreen message="LOADING SYSTEM" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
        <div className="min-h-screen text-white overflow-x-hidden">
          <AuthModal isOpen={true} onClose={() => {}} />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
          <div className="min-h-screen text-white overflow-x-hidden">
            <StickyHeader onHeightChange={setHeaderHeight} />
            <GymTracker headerHeight={headerHeight} />
            <ImageCarousel />
            <Reminders headerHeight={headerHeight} />
          </div>
        </div>
      } />
      <Route path="/profile" element={
        <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
          <div className="min-h-screen text-white overflow-x-hidden">
            <StickyHeader onHeightChange={setHeaderHeight} />
            {/* Add Profile component here */}
          </div>
        </div>
      } />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/gym-details" element={
        <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
          <div className="min-h-screen text-white overflow-x-hidden">
            <StickyHeader onHeightChange={setHeaderHeight} />
            <GymDetails />
          </div>
        </div>
      } />
      <Route path="/reminders/full" element={<RemindersFullScreen />} />
    </Routes>
  );
};

export default Main; 