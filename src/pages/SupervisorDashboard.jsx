import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Clock, AlertCircle, CalendarDays, Hash, FileText, CheckCircle2, X, Download, Info } from 'lucide-react';

const SupervisorDashboard = () => {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const todayDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedReport, setSelectedReport] = useState(null); // For Modal

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/reports', { headers: { 'Authorization': `Bearer ${token}` } });
      setAllReports(res.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  // Derive all state dynamically based on selectedDate and viewMode
  const { filteredReports, segmentData, presenceData, trendData, kpi } = useMemo(() => {
    if (!allReports.length) return { filteredReports: [], segmentData: [], presenceData: [], trendData: [], kpi: {lines:0, avgEff:0, absences:0} };

    // Determine date range
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    let startStr, endStr;

    if (viewMode === 'daily') {
      startStr = selectedDate;
      endStr = selectedDate;
    } else if (viewMode === 'weekly') {
      const dayOfWeek = dateObj.getDay() || 7; // 1-7 (Mon-Sun)
      const start = new Date(dateObj);
      start.setDate(dateObj.getDate() - dayOfWeek + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const format = (dt) => {
        const py = dt.getFullYear();
        const pm = String(dt.getMonth() + 1).padStart(2, '0');
        const pd = String(dt.getDate()).padStart(2, '0');
        return `${py}-${pm}-${pd}`;
      };
      startStr = format(start);
      endStr = format(end);
    } else if (viewMode === 'monthly') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0); // Last day of month
      const format = (dt) => {
        const py = dt.getFullYear();
        const pm = String(dt.getMonth() + 1).padStart(2, '0');
        const pd = String(dt.getDate()).padStart(2, '0');
        return `${py}-${pm}-${pd}`;
      };
      startStr = format(start);
      endStr = format(end);
    }

    // 1. Filter by Date Range
    const periodReports = allReports.filter(r => {
      const rDate = new Date(r.compte_rendu_date).toISOString().split('T')[0];
      return rDate >= startStr && rDate <= endStr;
    });
    
    // 2. Bar Chart Data
    const segmentMap = {};
    periodReports.forEach(r => {
      const seg = r.segment_famille;
      if (!segmentMap[seg]) segmentMap[seg] = { count: 0, totalEff: 0, Heures: 0, Present: 0, Absent: 0 };
      segmentMap[seg].count += 1;
      segmentMap[seg].totalEff += parseFloat(r.efficience || 0);
      segmentMap[seg].Heures += parseFloat(r.heures_produites || 0);
      segmentMap[seg].Present += parseInt(r.effectif_present || 0);
      segmentMap[seg].Absent += parseInt(r.absence || 0);
    });
    const segments = Object.keys(segmentMap).map(seg => ({
      name: seg,
      Efficience: parseFloat((segmentMap[seg].totalEff / segmentMap[seg].count).toFixed(1)),
      Heures: parseFloat(segmentMap[seg].Heures.toFixed(1)),
      Present: segmentMap[seg].Present,
      Absent: segmentMap[seg].Absent
    }));
    
    // 3. KPI & Presence Data
    let totalPresent = 0, totalAbsent = 0, totalEff = 0;
    periodReports.forEach(r => { 
      totalPresent += parseInt(r.effectif_present || 0); 
      totalAbsent += parseInt(r.absence || 0); 
      totalEff += parseFloat(r.efficience || 0);
    });
    
    const kpiData = {
      lines: periodReports.length,
      avgEff: periodReports.length > 0 ? (totalEff / periodReports.length).toFixed(1) : 0,
      absences: totalAbsent
    };

    const presence = [ { name: 'Present', value: totalPresent }, { name: 'Absent', value: totalAbsent } ];

    // 4. Trend Data 
    let trendReports = [];
    if (viewMode === 'daily') {
      const start = new Date(dateObj);
      start.setDate(start.getDate() - 6);
      const format = (dt) => {
        const py = dt.getFullYear();
        const pm = String(dt.getMonth() + 1).padStart(2, '0');
        const pd = String(dt.getDate()).padStart(2, '0');
        return `${py}-${pm}-${pd}`;
      };
      const trendStartStr = format(start);
      trendReports = allReports.filter(r => {
        const rDate = new Date(r.compte_rendu_date).toISOString().split('T')[0];
        return rDate >= trendStartStr && rDate <= selectedDate;
      });
    } else {
      trendReports = periodReports;
    }
    
    const groupedByDate = {};
    trendReports.forEach(r => {
      const d = new Date(r.compte_rendu_date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const sortKey = new Date(r.compte_rendu_date).toISOString().split('T')[0];
      if (!groupedByDate[sortKey]) groupedByDate[sortKey] = { date: d, Heures: 0, sortKey };
      groupedByDate[sortKey].Heures += parseFloat(r.heures_produites || 0);
    });
    
    const trends = Object.values(groupedByDate).sort((a,b) => a.sortKey.localeCompare(b.sortKey)).map(t => ({date: t.date, Heures: t.Heures}));

    return { filteredReports: periodReports, segmentData: segments, presenceData: presence, trendData: trends, kpi: kpiData };
  }, [allReports, selectedDate, viewMode]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  // Helper for issue color
  const getIssueColor = (type) => {
    switch(type) {
      case 'Machine breakdown': return 'border-l-rose-500 text-rose-600 bg-rose-50';
      case 'Quality issue': return 'border-l-amber-500 text-amber-600 bg-amber-50';
      case 'Supply shortage': return 'border-l-blue-500 text-blue-600 bg-blue-50';
      case 'HR issue': return 'border-l-purple-500 text-purple-600 bg-purple-50';
      default: return 'border-l-slate-400 text-slate-600 bg-slate-50';
    }
  };

  if (loading) return (
    <div className="p-4 md:p-6 w-full min-h-[100vh] bg-background">
      <div className="mb-6 flex flex-col md:flex-row justify-between animate-pulse gap-4">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-48 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-12 w-full md:w-96 bg-slate-200 rounded-2xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200/60 rounded-3xl border border-white/50 shadow-glass"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-[400px] bg-slate-200/60 rounded-3xl border border-white/50 shadow-glass"></div>)}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-2 w-full relative">
      
      {/* HEADER & DATE PICKER */}
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-brand-600 text-white font-black px-3 py-1 rounded-lg tracking-widest text-sm uppercase shadow-md shadow-brand-600/20">LEONI</div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Supervisor Dashboard</h1>
          </div>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Select a date and timeframe to view reports.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* EXPORT BUTTON */}
          <button className="flex items-center justify-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-2xl shadow-glass border border-slate-200 hover:border-brand-500 hover:text-brand-600 transition-colors font-semibold text-sm w-full sm:w-auto">
            <Download size={16} /> Export
          </button>
          {/* VIEW MODE TOGGLE */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-xl capitalize transition-all ${
                  viewMode === mode 
                    ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* DATE PICKER */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-glass border border-slate-200 cursor-pointer hover:border-brand-500 transition-colors w-full sm:w-auto">
            <CalendarDays size={20} className="text-brand-500 shrink-0"/>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="outline-none text-slate-700 font-bold bg-transparent w-full"
            />
          </div>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* SUMMARY KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div variants={cardVariants} className="glass-card p-5 md:p-6 flex flex-col justify-center relative group">
            <div className="flex items-center gap-3 mb-2">
              <Hash size={24} className="text-brand-500 shrink-0"/>
              <span className="text-slate-500 font-bold text-sm md:text-base flex items-center gap-1">Reports <Info size={14} className="text-slate-300 cursor-help"/></span>
            </div>
            <div className="absolute -top-10 left-6 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 shadow-lg">Total number of line reports submitted during this period.</div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{kpi.lines} <span className="text-xs md:text-sm font-semibold text-slate-400">total</span></div>
          </motion.div>
          
          <motion.div variants={cardVariants} className="glass-card p-5 md:p-6 flex flex-col justify-center relative group">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={24} className="text-emerald-500 shrink-0"/>
              <span className="text-slate-500 font-bold text-sm md:text-base flex items-center gap-1">Avg Efficiency <Info size={14} className="text-slate-300 cursor-help"/></span>
            </div>
            <div className="absolute -top-10 left-6 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 shadow-lg">Calculated as the average efficiency across all reported lines.</div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{kpi.avgEff}% <span className="text-xs md:text-sm font-semibold text-slate-400">across factory</span></div>
          </motion.div>
          
          <motion.div variants={cardVariants} className="glass-card p-5 md:p-6 flex flex-col justify-center relative group">
            <div className="flex items-center gap-3 mb-2">
              <Users size={24} className="text-rose-500 shrink-0"/>
              <span className="text-slate-500 font-bold text-sm md:text-base flex items-center gap-1">Total Absences <Info size={14} className="text-slate-300 cursor-help"/></span>
            </div>
            <div className="absolute -top-10 left-6 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 shadow-lg">Sum of all reported absent employees for this timeframe.</div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{kpi.absences} <span className="text-xs md:text-sm font-semibold text-slate-400">employees away</span></div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* EFFICIENCY BAR CHART */}
          <motion.div variants={cardVariants} className="glass-card p-4 md:p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><TrendingUp size={20} className="text-brand-500"/> Efficiency Per Line</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData} margin={{top: 0, right: 0, left: -25, bottom: 0}}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="Efficience" radius={[6, 6, 6, 6]} barSize={40}>
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Efficience >= 85 ? '#10b981' : (entry.Efficience >= 70 ? '#f59e0b' : '#ef4444')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-slate-500">≥85%</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-slate-500">70-84%</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs text-slate-500"><strike>{"<"}</strike>70%</span></div>
            </div>
          </motion.div>

          {/* WORKFORCE BAR CHART */}
          <motion.div variants={cardVariants} className="glass-card p-4 md:p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><Users size={20} className="text-brand-500"/> Workforce Per Line</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData} margin={{top: 0, right: 0, left: -25, bottom: 0}}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="Present" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-slate-500">Present</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs text-slate-500">Absent</span></div>
            </div>
          </motion.div>

          {/* PRODUCED HOURS PER LINE BAR CHART */}
          <motion.div variants={cardVariants} className="glass-card p-4 md:p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><Clock size={20} className="text-brand-500"/> Produced Hours Per Line</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData} margin={{top: 10, right: 10, left: -25, bottom: 0}}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} domain={[0, 100]} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="Heures" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#0033A0" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ISSUES FEED & LINE DRILL-DOWN */}
          <motion.div variants={cardVariants} className="glass-card p-4 md:p-6 h-[400px] flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-4 border-b border-slate-100"><AlertCircle size={20} className="text-amber-500"/> Logged Issues / Line Reports</h3>
            <div className="flex-col overflow-y-auto pr-2 pb-2 space-y-4">
              
              {filteredReports.map(r => (
                <div key={r.id} onClick={() => setSelectedReport(r)} className="cursor-pointer group">
                  <div className="flex justify-between items-center bg-white p-4 rounded-t-2xl border border-slate-200 shadow-sm group-hover:border-brand-300 transition-colors">
                    <span className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-brand-500 shrink-0"/> {r.segment_famille}</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{new Date(r.compte_rendu_date).toLocaleDateString([], {month:'short', day:'numeric'})}</span>
                  </div>
                  
                  {/* Issue List for this line */}
                  { (r.problem_1_type || r.problem_2_type || r.problem_3_type) ? (
                    <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex flex-col gap-2">
                       {r.problem_1_type && (
                         <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(r.problem_1_type)}`}>
                           <span className="text-xs font-bold uppercase tracking-wider block mb-1">{r.problem_1_type}</span>
                           <span className="text-sm font-medium">{r.problem_1_desc}</span>
                         </div>
                       )}
                       {r.problem_2_type && (
                         <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(r.problem_2_type)}`}>
                           <span className="text-xs font-bold uppercase tracking-wider block mb-1">{r.problem_2_type}</span>
                           <span className="text-sm font-medium">{r.problem_2_desc}</span>
                         </div>
                       )}
                       {r.problem_3_type && (
                         <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(r.problem_3_type)}`}>
                           <span className="text-xs font-bold uppercase tracking-wider block mb-1">{r.problem_3_type}</span>
                           <span className="text-sm font-medium">{r.problem_3_desc}</span>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-3 flex items-center justify-center">
                       <CheckCircle2 size={16} className="text-emerald-500 mr-2" />
                       <span className="text-xs font-medium text-slate-500">No issues reported</span>
                    </div>
                  )}
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 mt-8">
                  <span className="text-4xl pb-2">📂</span>
                  <p className="font-medium text-slate-400">No reports submitted for this date.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* DETAILED REPORT MODAL */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button onClick={() => setSelectedReport(null)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedReport.segment_famille}</h2>
              <p className="text-sm font-semibold text-brand-500 mb-6 border-b border-slate-100 pb-4">Reported By: {selectedReport.chef_name} on {new Date(selectedReport.compte_rendu_date).toLocaleDateString()}</p>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Declaration</span>
                  <p className="text-slate-700 font-medium">{selectedReport.declaration}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Production</span>
                     <p className="text-slate-800 font-bold text-xl">{selectedReport.heures_produites} Hrs</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Efficiency</span>
                     <p className="text-slate-800 font-bold text-xl">{selectedReport.efficience}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-emerald-100">
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-1">Present</span>
                     <p className="text-emerald-700 font-bold text-xl">{selectedReport.effectif_present}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-rose-100">
                     <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-1">Absent</span>
                     <p className="text-rose-700 font-bold text-xl">{selectedReport.absence}</p>
                  </div>
                </div>

                {/* ISSUES SECTION IN MODAL */}
                {(selectedReport.problem_1_type || selectedReport.problem_2_type || selectedReport.problem_3_type) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><AlertCircle size={16} className="text-amber-500" /> Reported Issues</h4>
                    {selectedReport.problem_1_type && (
                      <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(selectedReport.problem_1_type)}`}>
                         <span className="text-xs font-bold uppercase tracking-wider block mb-1">{selectedReport.problem_1_type}</span>
                         <span className="text-sm font-medium">{selectedReport.problem_1_desc}</span>
                      </div>
                    )}
                    {selectedReport.problem_2_type && (
                      <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(selectedReport.problem_2_type)}`}>
                         <span className="text-xs font-bold uppercase tracking-wider block mb-1">{selectedReport.problem_2_type}</span>
                         <span className="text-sm font-medium">{selectedReport.problem_2_desc}</span>
                      </div>
                    )}
                    {selectedReport.problem_3_type && (
                      <div className={`p-3 rounded-xl border-l-4 ${getIssueColor(selectedReport.problem_3_type)}`}>
                         <span className="text-xs font-bold uppercase tracking-wider block mb-1">{selectedReport.problem_3_type}</span>
                         <span className="text-sm font-medium">{selectedReport.problem_3_desc}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SupervisorDashboard;
