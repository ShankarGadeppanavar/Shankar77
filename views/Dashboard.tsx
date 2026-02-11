
import React from 'react';
import { Pig, FeedStatus } from '../types.ts';
import { AlertTriangle, TrendingUp, PiggyBank as PigIcon, Scale } from 'lucide-react';
import { getNutritionAdvice } from '../services/gemini.ts';

interface DashboardProps {
  pigs: Pig[];
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pigs, onNavigate }) => {
  const [advice, setAdvice] = React.useState<string>("Analyzing herd metrics for insights...");
  
  React.useEffect(() => {
    getNutritionAdvice(pigs).then(setAdvice);
  }, [pigs]);

  const underfedPigs = pigs.filter(p => p.status === FeedStatus.UNDERFED);
  const totalWeight = pigs.reduce((acc, p) => acc + p.weight, 0);
  const avgWeight = totalWeight / (pigs.length || 1);

  const kpis = [
    { label: 'Total Pigs', value: pigs.length, icon: PigIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Average Weight', value: `${avgWeight.toFixed(1)} kg`, icon: Scale, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Underfed Today', value: underfedPigs.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Growth Target', value: '+12%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  /**
   * World-class markdown formatter for simple bullet points and bolding.
   */
  const renderAdvice = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').filter(l => l.trim() !== '').map((line, i) => {
      // Handle bold text **bold**
      let content: React.ReactNode[] = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Handle bullet points
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      if (isBullet) {
        // Remove the list marker from the first segment if it's text
        if (typeof content[0] === 'string') {
          content[0] = content[0].replace(/^[\*\-]\s+/, '');
        }
        return (
          <div key={i} className="flex gap-3 mb-3 items-start group">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-pink-300 mt-1.5 group-hover:scale-150 transition-transform"></span>
            <span className="flex-1">{content}</span>
          </div>
        );
      }
      
      return <p key={i} className="mb-4">{content}</p>;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Farm Overview</h2>
        <p className="text-slate-500 font-medium">Real-time status of your livestock investment.</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`${kpi.bg} ${kpi.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <kpi.icon size={28} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-black mt-1 text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold flex items-center gap-3 text-slate-800">
                <AlertTriangle size={20} className="text-rose-500" />
                Critical Health Alerts
              </h3>
              <button onClick={() => onNavigate('alerts')} className="text-xs font-black uppercase tracking-widest text-pink-600 hover:text-pink-700 transition-colors">Review Center</button>
            </div>
            <div className="divide-y divide-slate-50">
              {underfedPigs.length > 0 ? (
                underfedPigs.slice(0, 5).map(pig => (
                  <div key={pig.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-5">
                      <img src={pig.photoUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{pig.tagId}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{pig.group} • {pig.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">Underfed</span>
                      <p className="text-xs font-bold text-slate-400 mt-2">{pig.lastIntakeKg.toFixed(2)}kg Intake</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-slate-400 italic font-medium">
                  <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={24} />
                  </div>
                  No active nutrition alerts. The herd is thriving.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <div className="bg-pink-600 p-2 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  Gemini Insight
                </h3>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">PRO MODE</span>
              </div>
              
              <div className="text-slate-300 text-sm leading-relaxed min-h-[180px]">
                {renderAdvice(advice)}
              </div>
              
              <button 
                onClick={() => onNavigate('reports')}
                className="mt-8 w-full py-5 bg-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-pink-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Deep Analytics
              </button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <PigIcon size={180} />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-600/10 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
