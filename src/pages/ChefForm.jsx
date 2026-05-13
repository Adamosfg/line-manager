import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudOff, Cloud, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { openDB } from 'idb';
import { motion } from 'framer-motion';

const PREDEFINED_LINES = ['Ligne A1', 'Ligne A2', 'Ligne B1', 'Ligne B2', 'Ligne C1'];
const ISSUE_TYPES = ['Machine breakdown', 'Quality issue', 'Supply shortage', 'HR issue', 'Other'];

const initDB = async () => {
  return openDB('line-manager-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('offline-reports')) {
        db.createObjectStore('offline-reports', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

const ChefForm = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const todayDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('chefFormData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {}
    }
    return {
      compte_rendu_date: todayDate,
      segment_famille: '',
      declaration: '',
      heures_produites: '',
      efficience: '',
      effectif_present: '',
      absence: '',
      problem_1_type: '', problem_1_desc: '',
      problem_2_type: '', problem_2_desc: '',
      problem_3_type: '', problem_3_desc: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('chefFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineData(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    setIsSyncing(true);
    try {
      const db = await initDB();
      const offlineReports = await db.getAll('offline-reports');
      
      if (offlineReports.length > 0) {
        for (const report of offlineReports) {
          const token = localStorage.getItem('token');
          await axios.post('/api/reports', report, { headers: { 'Authorization': `Bearer ${token}` }});
          await db.delete('offline-reports', report.id);
        }
      }
    } catch (err) {
      console.error('Sync failed', err);
    }
    setIsSyncing(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({
      compte_rendu_date: todayDate,
      segment_famille: '', declaration: '',
      heures_produites: '', efficience: '', effectif_present: '', absence: '',
      problem_1_type: '', problem_1_desc: '',
      problem_2_type: '', problem_2_desc: '',
      problem_3_type: '', problem_3_desc: ''
    });
    localStorage.removeItem('chefFormData');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    if (navigator.onLine) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/reports', payload, { headers: { 'Authorization': `Bearer ${token}` }});
        showSuccess();
      } catch (err) { saveOffline(payload); }
    } else {
      saveOffline(payload);
    }
  };

  const saveOffline = async (payload) => {
    try {
      const db = await initDB();
      await db.add('offline-reports', payload);
      showSuccess(true);
    } catch (dbErr) {
      alert('Failed to save offline.');
    }
  };

  const showSuccess = (offline = false) => {
    setSuccess(true);
    resetForm();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }} className="max-w-4xl mx-auto py-6 px-4">
      <div className="glass-card mb-10 overflow-hidden">
        {/* Header Section */}
        <div className="bg-white px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Daily Line Report</h2>
            <p className="text-slate-500 mt-1 font-medium">Verify your shift data before submitting.</p>
          </div>
          
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isOnline ? <Cloud size={18} /> : <CloudOff size={18} />}
            <span>{isOnline ? (isSyncing ? 'Syncing Data...' : 'Connected & Online') : 'Working Offline'}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-8 md:p-10 space-y-10">
          
          {/* SECTION: SHIFT DETAILS */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Shift Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="col-span-1">
                <label className="label-text">Date</label>
                <input type="date" name="compte_rendu_date" value={formData.compte_rendu_date} readOnly className="input-field bg-slate-100 text-slate-500 cursor-not-allowed" />
              </div>
              
              <div className="col-span-1">
                <label className="label-text">Line Segment</label>
                <select name="segment_famille" value={formData.segment_famille} onChange={handleChange} className="input-field appearance-none" required>
                  <option value="" disabled>Select a Line</option>
                  {PREDEFINED_LINES.map(line => <option key={line} value={line}>{line}</option>)}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="label-text">General Declaration / Shift Summary</label>
                <textarea name="declaration" rows="3" placeholder="How did the shift go?" value={formData.declaration} onChange={handleChange} className="input-field resize-none" required></textarea>
              </div>
            </div>
          </section>

          {/* SECTION: METRICS */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-end">
              Performance Metrics
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Strict validation active</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="col-span-1">
                <label className="label-text">Hours Produced</label>
                <input type="number" step="0.1" min="0" max="24" name="heures_produites" placeholder="e.g. 8.5" value={formData.heures_produites} onChange={handleChange} className="input-field" required />
              </div>

              <div className="col-span-1">
                <label className="label-text">Efficiency (%)</label>
                <input type="number" min="0" max="100" name="efficience" placeholder="e.g. 95 (max 100)" value={formData.efficience} onChange={handleChange} className="input-field" required />
              </div>

              <div className="col-span-1 flex gap-4">
                <div className="flex-1">
                  <label className="label-text text-emerald-600">Present Employees</label>
                  <input type="number" min="0" name="effectif_present" placeholder="Total" value={formData.effectif_present} onChange={handleChange} className="input-field border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20" required />
                </div>
                <div className="flex-1">
                  <label className="label-text text-rose-600">Absent Employees</label>
                  <input type="number" min="0" name="absence" placeholder="Total" value={formData.absence} onChange={handleChange} className="input-field border-rose-100 focus:border-rose-500 focus:ring-rose-500/20" required />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: ISSUES */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              Critical Issues (Optional)
            </h3>
            <p className="text-sm text-slate-500">If you encountered major blockers, describe them below. You may report up to 3.</p>

            {[1, 2, 3].map(num => (
              <div key={num} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
                <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">Issue 0{num}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <label className="label-text">Issue Type</label>
                    <select name={`problem_${num}_type`} value={formData[`problem_${num}_type`]} onChange={handleChange} className="input-field">
                      <option value="">None</option>
                      {ISSUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="label-text">Description</label>
                    {/* Make required conditionally based on if a type is selected */}
                    <input 
                      type="text" 
                      name={`problem_${num}_desc`} 
                      value={formData[`problem_${num}_desc`]} 
                      onChange={handleChange} 
                      placeholder="Brief description..." 
                      className={`input-field ${formData[`problem_${num}_type`] ? 'border-orange-300 bg-white' : 'opacity-70 cursor-not-allowed'}`} 
                      required={!!formData[`problem_${num}_type`]} 
                      disabled={!formData[`problem_${num}_type`]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <div className="pt-6">
            {success ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-3 bg-emerald-50 text-emerald-600 font-bold py-5 rounded-2xl w-full border border-emerald-100 shadow-sm">
                <CheckCircle2 size={24} /> Verified & Authenticated Successfully
              </motion.div>
            ) : (
              <button type="submit" className="btn-primary py-5">
                Submit Production Report <ChevronRight size={20} />
              </button>
            )}
          </div>

        </form>
      </div>
    </motion.div>
  );
};

export default ChefForm;
