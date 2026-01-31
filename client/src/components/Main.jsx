import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import StickyHeader from "./Header";
import Reminders from "./Reminder";
import AuthModal from "./AuthModal";
import GymDetails from "./GymDetails";
import LoadingScreen from "./LoadingScreen";
import RemindersFullScreen from "./RemindersFullScreen";
import DailyHabits from "./DailyHabits";
import WeeklyHabits from "./WeeklyHabits";
import CatDetails from "./CatDetails";
import TodoList from "./TodoList";

const TAB_KEYS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  GYM: 'gym',
  CAT: 'cat',
  TODO: 'todo',
};

const HomeTabsLayout = ({ headerHeight, setHeaderHeight }) => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.DAILY);

  const renderContent = () => {
    switch (activeTab) {
      case TAB_KEYS.DAILY:
        return (
          <DailyHabits />
        );
      case TAB_KEYS.WEEKLY:
        return <WeeklyHabits />;
      case TAB_KEYS.GYM:
        return (
          // Show the full GymDetails experience inline when the Gym tab is active.
          <GymDetails inline />
        );
      case TAB_KEYS.CAT:
        return <CatDetails />;
      case TAB_KEYS.TODO:
        return <TodoList />;
      default:
        return null;
    }
  };

  const tabs = [
    { key: TAB_KEYS.DAILY, label: 'Daily Habits' },
    { key: TAB_KEYS.WEEKLY, label: 'Weekly Habits' },
    { key: TAB_KEYS.GYM, label: 'Gym Tracker' },
    { key: TAB_KEYS.CAT, label: 'CAT' },
    { key: TAB_KEYS.TODO, label: 'To-do list' },
  ];

  return (
    <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
      <div className="min-h-screen text-white overflow-x-hidden">
        <StickyHeader 
          onHeightChange={setHeaderHeight}
        />

        <div
          id="home-tabs-root"
          className="w-full mt-48"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          {/* Tabs bar (sticky under the header) */}
          <div
            className="flex items-center gap-12 justify-center mb-8 border-b border-white/10 overflow-x-auto sticky top-24 z-30 "
          >
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <React.Fragment key={tab.key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={[
                      "!text-[20px] md:text-base whitespace-nowrap transition-all duration-200 px-2 pb-2",
                      isActive
                        ? "text-[#d62e49] font-semibold border-b-2 border-[#d62e49]"
                        : "text-gray-400 hover:text-gray-200",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                  {index < tabs.length - 1 && (
                    <span className="text-gray-500 text-lg">|</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="mt-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

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
        <HomeTabsLayout 
          headerHeight={headerHeight} 
          setHeaderHeight={setHeaderHeight} 
        />
      } />
      <Route path="/profile" element={
        <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
          <div className="min-h-screen text-white overflow-x-hidden">
            <StickyHeader onHeightChange={setHeaderHeight} />
            {/* Add Profile component here */}
          </div>
        </div>
      } />
      <Route path="/gym-details" element={
        <div className="min-h-screen bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] rounded-[32px] p-8 md:p-10">
          <div className="min-h-screen text-white overflow-x-hidden">
            <StickyHeader onHeightChange={setHeaderHeight} />
            <GymDetails inline />
          </div>
        </div>
      } />
      <Route path="/reminders/full" element={<RemindersFullScreen />} />
    </Routes>
  );
};

export default Main; 