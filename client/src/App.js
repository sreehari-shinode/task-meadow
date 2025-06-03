import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from "./components/LoadingScreen";
import ScreenBorder from './components/ScreenBorder';
import { BrowserRouter as Router } from 'react-router-dom';
import Main from './components/Main';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Handle initial page load
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setPageLoading(false);
      } else {
        const timer = setTimeout(() => {
          setPageLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, user]);

  // Handle content loading
  useEffect(() => {
    if (!pageLoading) {
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pageLoading]);

  if (authLoading || pageLoading) {
    return (
      <ScreenBorder>
        <LoadingScreen message="LOADING SYSTEM" />
      </ScreenBorder>
    );
  }

  return (
    <ScreenBorder>
      <Main 
        headerHeight={headerHeight} 
        setHeaderHeight={setHeaderHeight}
        user={user}
        contentLoaded={contentLoaded}
      />
    </ScreenBorder>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
