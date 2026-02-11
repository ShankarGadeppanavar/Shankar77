
import React from 'react';
import { UserRole, UserProfile } from '../types.ts';
import { Camera, Mail, User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<UserRole>(UserRole.ADMIN);
  const [photoUrl, setPhotoUrl] = React.useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    onLogin({ name, email, role, photoUrl });
  };

  const generateAvatar = () => {
    setPhotoUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="bg-slate-900 p-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="grid grid-cols-6 gap-2 rotate-12 scale-150">
               {[...Array(24)].map((_, i) => <div key={i} className="w-10 h-10 bg-white rounded-full" />)}
             </div>
          </div>
          <h1 className="text-4xl font-bold brand text-pink-500 relative z-10">Liveshock</h1>
          <p className="text-slate-400 text-sm font-medium tracking-widest mt-1 relative z-10 uppercase">Nutrition Management</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="relative group">
              <img 
                src={photoUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full bg-slate-100 ring-4 ring-pink-500/20 object-cover"
              />
              <button 
                type="button"
                onClick={generateAvatar}
                className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full shadow-lg hover:bg-pink-700 transition-colors"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Tap to change avatar</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-500 outline-none font-medium"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="email" 
                placeholder="Work Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-500 outline-none font-medium"
              />
            </div>

            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-500 outline-none font-medium appearance-none"
              >
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-5 bg-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-pink-700 active:scale-[0.98] transition-all"
          >
            ENTER FARM DASHBOARD
          </button>

          <p className="text-center text-xs text-slate-400 font-medium">
            By logging in, you agree to the farm's feed safety protocols.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
