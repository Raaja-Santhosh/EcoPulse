import React from 'react';
import { useEcoPulseStore } from '../store';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { EcoIsland } from './EcoIsland';

export const DashboardTab: React.FC = () => {
  const { score, categoryScores, logs, xp, streak, resetAll, clearLogs } = useEcoPulseStore();

  // Calculate current score modified by daily activity logs (converting kg CO2e logs to annual tons CO2e)
  const logImpactTons = logs.reduce((sum, log) => sum + (log.carbon / 1000), 0);
  const currentTotalScore = Math.max(0.1, Math.round((score + logImpactTons) * 100) / 100);

  // Compute category scores modified by logs
  const energyLog = logs.filter(l => l.category === 'energy').reduce((sum, l) => sum + l.carbon / 1000, 0);
  const transportLog = logs.filter(l => l.category === 'transport').reduce((sum, l) => sum + l.carbon / 1000, 0);
  const dietLog = logs.filter(l => l.category === 'diet').reduce((sum, l) => sum + l.carbon / 1000, 0);
  const wasteLog = logs.filter(l => l.category === 'waste').reduce((sum, l) => sum + l.carbon / 1000, 0);

  const finalEnergy = Math.max(0, Math.round((categoryScores.energy + energyLog) * 100) / 100);
  const finalTransport = Math.max(0, Math.round((categoryScores.transport + transportLog) * 100) / 100);
  const finalDiet = Math.max(0, Math.round((categoryScores.diet + dietLog) * 100) / 100);
  const finalWaste = Math.max(0, Math.round((categoryScores.waste + wasteLog) * 100) / 100);

  // Recharts Pie Chart Data
  const pieData = [
    { name: 'Energy', value: finalEnergy, color: '#d4a359' },
    { name: 'Transport', value: finalTransport, color: '#c87a53' },
    { name: 'Diet', value: finalDiet, color: '#4a6b5d' },
    { name: 'Waste', value: finalWaste, color: '#79a6d2' },
  ].filter(d => d.value > 0);

  // Recharts Line Chart Data (Simulated last 7 days of emissions based on real logs)
  const lineData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Find logs on this date
    const dayLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.toDateString() === d.toDateString();
    });

    const dailyLogImpact = dayLogs.reduce((sum, l) => sum + (l.carbon / 1000), 0);
    const dailyEmissions = Math.max(0.01, Math.round(((score / 365) + dailyLogImpact) * 100) / 100);

    return {
      date: dateStr,
      Emissions: dailyEmissions,
    };
  });


  // Fictional Leaderboard
  const baseLeaderboard = [
    { name: 'Aria Thorne', xp: 1750, avatar: '🦊' },
    { name: 'Kaelen Miller', xp: 1200, avatar: '🌲' },
    { name: 'Lia Zhang', xp: 620, avatar: '🦉' },
    { name: 'You', xp: xp, avatar: '🌱' },
    { name: 'Rowan Vance', xp: 180, avatar: '💧' },
  ];

  const sortedLeaderboard = [...baseLeaderboard].sort((a, b) => b.xp - a.xp);
  const userRank = sortedLeaderboard.findIndex((item) => item.name === 'You') + 1;

  // Comparison Text
  const targetDiff = Math.round((currentTotalScore - 2.0) * 10) / 10;
  const comparisonText =
    targetDiff <= 0
      ? `You are ${Math.abs(targetDiff)} tons below the global sustainability target. Exceptional!`
      : `You are ${targetDiff} tons above the global target. Try completing some habits!`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" role="tabpanel" aria-label="Eco Metrics Dashboard">
      
      {/* LEFT COLUMN: Hero Score and Eco-Island */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Score Display Card */}
        <div className="neo-card bg-white p-6 border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 w-full text-center md:text-left">
            <h3 className="text-xs text-[#4a6b5d] uppercase tracking-wider font-bold mb-1 font-sans">
              ACTIVE CARBON SCORE
            </h3>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-6xl font-black font-mono text-[#d4a359]">{currentTotalScore}</span>
              <span className="text-sm text-[#4a6b5d] font-bold uppercase font-sans">tons CO₂e / yr</span>
            </div>
            <p className="text-xs text-[#4a6b5d] mt-2 font-medium">
              {comparisonText}
            </p>
          </div>

          {/* Bar comparison */}
          <div className="flex-1 w-full">
            <div className="flex justify-between text-xs font-bold text-[#4a6b5d] mb-2 font-sans">
              <span>CURRENT</span>
              <span>GLOBAL TARGET (2.0t)</span>
            </div>
            <div className="w-full h-6 bg-[#f5f3eb] border-2 border-[#2b3a34] rounded-none relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4a6b5d] to-[#c87a53] transition-all duration-1000"
                style={{ width: `${Math.min(100, (currentTotalScore / 15) * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-[3px] bg-[#d4a359] shadow-[0_0_4px_#d4a359]"
                style={{ left: `${(2.0 / 15) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#4a6b5d] mt-1 italic">
              Scale is calculated out of 15.0 tons (US national average is ~16t).
            </p>
          </div>
        </div>

        {/* Eco-Island Visualizer */}
        <EcoIsland />

        {/* Charts block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pie Chart: Composition */}
          <div className="neo-card bg-white p-4 border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col gap-2">
            <h4 className="text-md font-serif font-bold text-[#2b3a34]">Emissions Composition</h4>
            <span className="text-[10px] text-[#4a6b5d] uppercase tracking-wider font-bold">Category Distribution (Tons)</span>
            <div className="w-full h-48">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#4a6b5d]">No emissions recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} t`} />
                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Line Chart: Trends */}
          <div className="neo-card bg-white p-4 border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col gap-2">
            <h4 className="text-md font-serif font-bold text-[#2b3a34]">Emissions Trend</h4>
            <span className="text-[10px] text-[#4a6b5d] uppercase tracking-wider font-bold">Daily Carbon logs (last 7 days)</span>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3eb" />
                  <XAxis dataKey="date" stroke="#2b3a34" style={{ fontSize: '8px', fontWeight: 'bold' }} />
                  <YAxis stroke="#2b3a34" style={{ fontSize: '8px', fontWeight: 'bold' }} />
                  <Tooltip formatter={(value) => `${value} kg`} />
                  <Line type="monotone" dataKey="Emissions" stroke="#c87a53" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Leaderboard & Actions */}
      <div className="flex flex-col gap-6">
        
        {/* Streak & XP Card */}
        <div className="neo-card bg-[#f5f3eb] p-6 border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col gap-4">
          <h3 className="text-md font-serif font-bold text-[#2b3a34] border-b-2 border-[#2b3a34] pb-2">
            YOUR REWARDS
          </h3>
          <div className="flex justify-around text-center">
            <div>
              <span className="text-[10px] text-[#4a6b5d] font-bold block">EXPERIENCE</span>
              <span className="text-2xl font-mono font-bold text-[#d4a359]">{xp} XP</span>
            </div>
            <div className="border-l-2 border-[#2b3a34] h-10" />
            <div>
              <span className="text-[10px] text-[#4a6b5d] font-bold block">DAILY STREAK</span>
              <span className="text-2xl font-mono font-bold text-[#c87a53]">🔥 {streak} Days</span>
            </div>
          </div>
          <div className="text-xs text-[#4a6b5d] text-center italic mt-2">
            Level up by completing commitments and eco choices!
          </div>
        </div>

        {/* Community Leaderboard */}
        <div className="neo-card bg-white p-6 border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col gap-4">
          <h3 className="text-md font-serif font-bold text-[#2b3a34] border-b-2 border-[#2b3a34] pb-2">
            LEADERBOARD
          </h3>
          <div className="flex flex-col gap-3">
            {sortedLeaderboard.map((item, idx) => {
              const isUser = item.name === 'You';
              const rankClass =
                idx === 0
                  ? 'border-[#d4a359] bg-[#fefaf0]'
                  : idx === 1
                  ? 'border-[#94a3b8] bg-[#f8fafc]'
                  : idx === 2
                  ? 'border-[#c87a53] bg-[#fffaf5]'
                  : 'border-[#2b3a34]';
              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between p-2.5 border-2 ${rankClass} ${
                    isUser ? 'font-bold bg-[#f5f3eb]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm w-4">{idx + 1}</span>
                    <span className="text-lg">{item.avatar}</span>
                    <span className="text-sm text-[#2b3a34]">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs text-[#4a6b5d]">{item.xp} XP</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#4a6b5d] text-center font-bold uppercase tracking-wider mt-2">
            You are Ranked #{userRank} of 5 participants
          </p>
        </div>

        {/* Reset settings */}
        <div className="neo-card bg-white p-6 border-2 border-dashed border-[#c87a53] shadow-[4px_4px_0px_#c87a53] flex flex-col gap-4">
          <h3 className="text-sm font-serif font-bold text-[#c87a53] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> DANGER ZONE
          </h3>
          <p className="text-xs text-[#4a6b5d]">
            Resetting clears all persistent local storage calculations, streaks, and onboarding.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearLogs}
              className="secondary-btn border-[#c87a53] text-[#c87a53] flex-1 text-xs py-2"
            >
              CLEAR LOGS
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="primary-btn bg-[#c87a53] hover:bg-[#ef4444] flex-1 text-xs py-2"
            >
              RESET ALL
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default DashboardTab;
