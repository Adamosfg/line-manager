import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Activity } from 'lucide-react';
import Login from './pages/Login';
import ChefForm from './pages/ChefForm';
import SupervisorDashboard from './pages/SupervisorDashboard';

function App() {
  const [auth, setAuth] = useState(() => ({
    isAuth: !!localStorage.getItem('token'),
    role: localStorage.getItem('role')
  }));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ isAuth: false, role: null });
  };

  return (
    <Router>
      <div className="app-container font-sans text-slate-800 selection:bg-brand-500/30">
        
        <AnimatePresence>
          {auth.isAuth && (
            <motion.nav 
              initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
              className="px-4 py-4 md:px-8 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex justify-between items-center sticky top-0 z-50 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-500 rounded-xl p-2 shadow-sm text-white">
                  <Activity size={20} strokeWidth={2.5}/>
                </div>
                <span className="font-bold text-lg hidden sm:block tracking-tight">Sentinel Line</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl font-semibold transition-colors border border-slate-200/50"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 pb-20">
          <Routes>
            <Route path="/" element={
                !auth.isAuth ? <Login setAuth={setAuth} /> : 
                (auth.role === 'chef' ? <Navigate to="/formulaire" /> : <Navigate to="/dashboard" />)
              } 
            />
            <Route path="/formulaire" element={ (auth.isAuth && auth.role === 'chef') ? <ChefForm /> : <Navigate to="/" /> } />
            <Route path="/dashboard" element={ (auth.isAuth && auth.role === 'supervisor') ? <SupervisorDashboard /> : <Navigate to="/" /> } />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;
