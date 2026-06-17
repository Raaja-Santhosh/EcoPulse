import React, { useState } from 'react';
import { useEcoPulseStore } from './store';
import Onboarding from './components/Onboarding';
import HomeTab from './components/HomeTab';
import DashboardTab from './components/DashboardTab';
import ActionCenterTab from './components/ActionCenterTab';
import NudgesTab from './components/NudgesTab';
import TrackerTab from './components/TrackerTab';
import AssistantTab from './components/AssistantTab';
import LandingPage from './components/LandingPage';
import { Leaf, Award } from 'lucide-react';

const App: React.FC = () => {
  const { onboarded, xp, level, levelName, resetAll } = useEcoPulseStore();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'actions' | 'nudges' | 'tracker' | 'assistant'>('home');
  const [enteredApp, setEnteredApp] = useState<boolean>(false);

  // Calculate XP progress percentage
  const getXpProgressPercent = (): number => {
    if (xp >= 1500) return 100;
    
    let base = 0;
    let limit = 150;
    
    if (xp >= 800) {
      base = 800;
      limit = 1500;
    } else if (xp >= 400) {
      base = 400;
      limit = 800;
    } else if (xp >= 150) {
      base = 150;
      limit = 400;
    }
    
    const range = limit - base;
    const current = xp - base;
    return Math.min(100, Math.max(0, (current / range) * 100));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-[#faf9f5] border-2 border-[#2b3a34] p-4 shadow-[2px_2px_0px_#2b3a34]">
              <span className="text-sm font-bold text-[#4a6b5d]">Welcome to the EcoPulse Literacy Hub</span>
              <button
                onClick={() => setEnteredApp(false)}
                className="py-1.5 px-3 bg-[#c87a53] text-white border-2 border-[#2b3a34] font-bold text-xs uppercase shadow-[1px_1px_0px_#2b3a34] hover:translate-y-[-1px] transition-all"
              >
                Back to Landing Page
              </button>
            </div>
            <HomeTab onNavigateToDashboard={() => setActiveTab('dashboard')} />
          </div>
        );
      case 'dashboard':
        return <DashboardTab />;
      case 'actions':
        return <ActionCenterTab />;
      case 'nudges':
        return <NudgesTab />;
      case 'tracker':
        return <TrackerTab />;
      case 'assistant':
        return <AssistantTab />;
      default:
        return <HomeTab onNavigateToDashboard={() => setActiveTab('dashboard')} />;
    }
  };

  if (!enteredApp) {
    return <LandingPage onEnterApp={() => setEnteredApp(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf7] text-[#2b3a34] font-sans">
      
      {/* HEADER SECTION */}
      <header className="app-header border-b-2 border-[#2b3a34] bg-white px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="logo flex items-center gap-2">
          <span className="p-1.5 bg-[#4a6b5d] text-white border-2 border-[#2b3a34]">
            <Leaf className="w-6 h-6" />
          </span>
          <span className="logo-text text-xl font-bold tracking-tight uppercase font-serif text-[#d4a359]">
            EcoPulse
          </span>
        </div>

        {/* Tab Navigation */}
        {onboarded && (
          <nav className="nav-links flex gap-1 bg-[#f5f3eb] p-1 border-2 border-[#2b3a34]" role="tablist" aria-label="Main Navigation">
            <button
              role="tab"
              aria-selected={activeTab === 'home'}
              aria-controls="home-tab-panel"
              onClick={() => setActiveTab('home')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'home' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Home
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              aria-controls="dashboard-tab-panel"
              onClick={() => setActiveTab('dashboard')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'dashboard' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Dashboard
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'actions'}
              aria-controls="actions-tab-panel"
              onClick={() => setActiveTab('actions')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'actions' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Action Center
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'nudges'}
              aria-controls="nudges-tab-panel"
              onClick={() => setActiveTab('nudges')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'nudges' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Decision Sandbox
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'tracker'}
              aria-controls="tracker-tab-panel"
              onClick={() => setActiveTab('tracker')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'tracker' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Activity Log
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'assistant'}
              aria-controls="assistant-tab-panel"
              onClick={() => setActiveTab('assistant')}
              className={`nav-btn py-2 px-4 text-xs font-bold uppercase transition-all duration-100 ${
                activeTab === 'assistant' ? 'active bg-[#4a6b5d] text-white border-2 border-[#2b3a34] shadow-[2px_2px_0px_#2b3a34]' : 'text-[#4a6b5d] hover:bg-[#faf9f5]'
              }`}
            >
              Eco-Assistant
            </button>
          </nav>
        )}

        {/* Level & XP progression */}
        <div className="xp-progress-wrapper flex flex-col items-center md:items-end gap-1.5">
          <div className="user-badge flex items-center gap-1 text-xs font-bold text-[#2b3a34]">
            <Award className="w-4 h-4 text-[#d4a359]" />
            <span>Level {level}: {levelName}</span>
          </div>
          <div id="xp-progress-bar-container" className="w-[130px] h-2 border-2 border-[#2b3a34] bg-[#f5f3eb] overflow-hidden">
            <div
              id="xp-progress-bar"
              className="h-full bg-[#4a6b5d] transition-all duration-500"
              style={{ width: `${getXpProgressPercent()}%` }}
            />
          </div>
          {onboarded && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset your baseline score and retake the quiz? All your daily logs and XP will be cleared.")) {
                  resetAll();
                  setActiveTab('home');
                }
              }}
              className="text-[10px] font-bold uppercase underline tracking-[0.5px] text-[#c87a53] hover:text-[#2b3a34] transition-all mt-0.5 cursor-pointer"
            >
              Reset & Retake Quiz
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="app-container flex-1 py-10 px-6 max-w-7xl mx-auto w-full box-border">
        {onboarded ? (
          <div id={`${activeTab}-tab-panel`} role="tabpanel">
            {renderActiveTab()}
          </div>
        ) : (
          <Onboarding />
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer text-center py-6 border-t-2 border-[#2b3a34] text-xs text-[#4a6b5d] bg-white">
        © {new Date().getFullYear()} EcoPulse 🌱 — Tactile Physical Carbon Awareness Platform. All rights reserved.
      </footer>

    </div>
  );
};

export default App;
