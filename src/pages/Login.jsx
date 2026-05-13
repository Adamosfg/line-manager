import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ShieldCheck, ArrowRight, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ setAuth }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setPin('');
    setError('');
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'chef' && pin === '1234') {
      handleLogin('chef');
    } else if (selectedRole === 'supervisor' && pin === '5555') {
      handleLogin('supervisor');
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handleLogin = async (role) => {
    try {
      const response = await axios.post('/api/auth/test-login', { role });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      
      setAuth({ isAuth: true, role: user.role });
      
      if (user.role === 'chef') {
        navigate('/formulaire');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error', error);
      setError('Error connecting to server. Is the database running?');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4">
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="glass-card p-8 md:p-12 w-full max-w-md text-center relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div variants={itemVariants} className="mb-10 relative z-10">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner-soft">
             <ShieldCheck size={32} className="text-brand-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500">Access your role portal below</p>
        </motion.div>
        
        <div className="relative z-10 min-h-[160px]">
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div 
                key="roles" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }} 
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <button 
                  className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-500 hover:shadow-glass-hover transition-all duration-300" 
                  onClick={() => handleRoleSelect('chef')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Users size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900">Line Chef</span>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </button>
                
                <button 
                  className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] transition-all duration-300" 
                  onClick={() => handleRoleSelect('supervisor')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <ShieldCheck size={24} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900">Supervisor</span>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="pin" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setSelectedRole(null)} className="text-slate-400 hover:text-brand-600 flex items-center gap-1 text-sm font-bold transition-colors">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div className="flex items-center gap-2">
                    {selectedRole === 'chef' ? <Users size={16} className="text-brand-500" /> : <ShieldCheck size={16} className="text-emerald-500" />}
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{selectedRole === 'chef' ? 'Line Chef' : 'Supervisor'}</span>
                  </div>
                </div>

                <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ''));
                        setError('');
                      }}
                      placeholder="Enter 4-Digit PIN"
                      className={`w-full bg-slate-50 border ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'} rounded-2xl pl-12 pr-4 py-4 text-center text-2xl tracking-[0.5em] font-black text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-inner-soft`}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-rose-500 text-sm font-bold animate-pulse">{error}</p>}
                  <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,51,160,0.3)] hover:shadow-[0_8px_30px_rgb(0,51,160,0.5)] active:scale-[0.98]">
                    Verify & Login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
