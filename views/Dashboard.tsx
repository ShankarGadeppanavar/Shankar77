
import React from 'react';
import { Pig, FeedStatus, PigGroup } from '../types.ts';
import { AlertTriangle, TrendingUp, PiggyBank as PigIcon, Scale } from 'lucide-react';
import { getNutritionAdvice } from '../services/gemini.ts';

interface DashboardProps {
  pigs: Pig[];
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pigs, onNavigate }) => {
  const [advice, setAdvice] = React.useState<string>("Loading nutrition tips...");
  
  React.useEffect(() => {
    getNutritionAdvice(pigs).then(setAdvice);
  }, [pigs]);

  const underfedPigs = pigs.filter(p => p.status === FeedStatus.UNDERFED);
  const totalWeight = pigs.reduce((acc, p) => acc + p.weight, 0);
  const avgWeight = totalWeight / pigs.length;

  const kpis = [
    { label: 'Total Pigs', value: pigs.length, icon: PigIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Average Weight', value: `${avgWeight.toFixed(1)} kg`, icon: Scale, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Underfed Today', value: underfedPigs.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Growth Target', value: '+12%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Farm Overview</h2>
        <p className="text-slate-500">Live data for your pig herd.</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
              <kpi.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                Urgent Alerts
              </h3>
              <button onClick={() => onNavigate('alerts')} className="text-sm text-pink-600 font-semibold hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {underfedPigs.slice(0, 5).map(pig => (
                <div key={pig.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={pig.photoUrl} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-800">{pig.tagId} ({pig.name})</p>
                      <p className="text-xs text-slate-400 uppercase font-medium">{pig.group}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase">Underfed</span>
                    <p className="text-xs text-slate-400 mt-1">Intake: {pig.lastIntakeKg.toFixed(2)} kg</p>
                  </div>
                </div>
              ))}
              {underfedPigs.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic">No feeding alerts today! All pigs are on track.</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="space-y-4">
          <div className="bg-pink-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Nutrition Insight
              </h3>
              <div className="text-pink-50 text-sm leading-relaxed whitespace-pre-line bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                {advice}
              </div>
              <button 
                onClick={() => onNavigate('reports')}
                className="mt-6 w-full py-3 bg-white text-pink-600 font-bold rounded-xl shadow-lg active:scale-95 transition-all"
              >
                View Full Analysis
              </button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PigIcon size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
