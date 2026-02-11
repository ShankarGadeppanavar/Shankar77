
import React from 'react';
import { Pig, FeedEvent, FeedStatus, PigGroup } from '../types.ts';
import { FEED_TYPES } from '../constants.tsx';
import { BarChart3, TrendingUp, AlertCircle, Calendar, Download, DollarSign, PieChart, Filter } from 'lucide-react';

interface ReportsProps {
  pigs: Pig[];
  feedEvents: FeedEvent[];
}

const Reports: React.FC<ReportsProps> = ({ pigs, feedEvents }) => {
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');

  // Filter events based on period
  const filteredEvents = React.useMemo(() => {
    if (period === 'all') return feedEvents;
    const now = new Date();
    const days = period === '7d' ? 7 : 30;
    const threshold = new Date(now.setDate(now.getDate() - days));
    return feedEvents.filter(e => new Date(e.timestamp) >= threshold);
  }, [feedEvents, period]);

  // General Status Stats
  const underfedCount = pigs.filter(p => p.status === FeedStatus.UNDERFED).length;
  const okCount = pigs.filter(p => p.status === FeedStatus.OK).length;
  const totalPigs = pigs.length;
  const okPercentage = Math.round((okCount / totalPigs) * 100);
  const underfedPercentage = Math.round((underfedCount / totalPigs) * 100);

  // Group stats
  const groupStats = Object.values(PigGroup).map(group => {
    const groupPigs = pigs.filter(p => p.group === group);
    const avgWeight = groupPigs.length > 0 
      ? groupPigs.reduce((acc, p) => acc + p.weight, 0) / groupPigs.length 
      : 0;
    return { group, count: groupPigs.length, avgWeight };
  });

  // Cost Analysis Logic
  const costAnalysis = React.useMemo(() => {
    let totalCost = 0;
    let totalKg = 0;
    const byGroup: Record<string, number> = {};
    const byFeed: Record<string, number> = {};

    filteredEvents.forEach(event => {
      const feedConfig = FEED_TYPES.find(f => f.name === event.feedType);
      const cost = event.totalKg * (feedConfig?.costPerKg || 0);
      
      totalCost += cost;
      totalKg += event.totalKg;
      
      byGroup[event.group] = (byGroup[event.group] || 0) + cost;
      byFeed[event.feedType] = (byFeed[event.feedType] || 0) + cost;
    });

    return { totalCost, totalKg, byGroup, byFeed };
  }, [filteredEvents]);

  const handleExportCSV = () => {
    if (pigs.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Tag ID", "Name", "Group", "Weight (kg)", "Sex", "Breed", "Status", "Last Intake (kg)", "Birth Date"];
    const rows = pigs.map(p => [
      `"${p.tagId}"`,
      `"${p.name}"`,
      `"${p.group}"`,
      p.weight.toString(),
      `"${p.sex}"`,
      `"${p.breed}"`,
      `"${p.status}"`,
      p.lastIntakeKg.toFixed(2),
      `"${p.dob}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `liveshock_herd_report_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-slate-500">Comprehensive farm performance and financial data.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(['all', '7d', '30d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter ${
                  period === p ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p === 'all' ? 'Life' : p}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 transition-all shadow-lg active:scale-95"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <DollarSign size={20} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Total Feed Cost</span>
          </div>
          <p className="text-3xl font-black">${costAnalysis.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] mt-2 text-slate-400 font-bold uppercase tracking-widest">Current Period ({period})</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <BarChart3 size={20} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Feed Consumed</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{costAnalysis.totalKg.toLocaleString()} <span className="text-sm">kg</span></p>
          <p className="text-[10px] mt-2 text-slate-400 font-bold uppercase tracking-widest">Avg ${ (costAnalysis.totalKg > 0 ? costAnalysis.totalCost / costAnalysis.totalKg : 0).toFixed(2) } / kg</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <AlertCircle size={20} className="text-pink-500" />
            <span className="text-xs font-bold uppercase tracking-widest">On Target</span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{okPercentage}%</p>
          <p className="text-[10px] mt-2 text-slate-400 font-bold uppercase tracking-widest">Nutritional Coverage</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <TrendingUp size={20} className="text-purple-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Growth Index</span>
          </div>
          <p className="text-3xl font-black text-slate-800">+4.2%</p>
          <p className="text-[10px] mt-2 text-slate-400 font-bold uppercase tracking-widest">Estimated weekly gain</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Group Breakdown */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-3">
              <PieChart size={20} className="text-emerald-500" />
              Expenditure by Group
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded uppercase tracking-widest">Currency: USD</span>
          </div>
          
          <div className="space-y-6">
            {Object.values(PigGroup).map(group => {
              const cost = costAnalysis.byGroup[group] || 0;
              const pct = costAnalysis.totalCost > 0 ? (cost / costAnalysis.totalCost) * 100 : 0;
              return (
                <div key={group}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-slate-700">{group}</span>
                    <span className="text-sm font-black text-slate-900">${cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {costAnalysis.totalCost === 0 && (
              <div className="py-12 text-center text-slate-400 italic text-sm">No expenditure recorded in this period.</div>
            )}
          </div>
        </div>

        {/* Cost by Formulation */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Filter size={18} className="text-blue-500" />
            Cost by Feed Type
          </h3>
          <div className="space-y-4">
            {FEED_TYPES.map(feed => {
              const cost = costAnalysis.byFeed[feed.name] || 0;
              const pct = costAnalysis.totalCost > 0 ? (cost / costAnalysis.totalCost) * 100 : 0;
              return (
                <div key={feed.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{feed.name}</p>
                    <p className="text-xs font-black text-blue-600">{Math.round(pct)}%</p>
                  </div>
                  <p className="text-lg font-black text-slate-800">${cost.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Unit Cost: ${feed.costPerKg.toFixed(2)} / kg</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Herd Health Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-pink-600" />
            Nutritional Status
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-600">On Target (OK)</span>
                <span className="font-black text-emerald-600">{okCount} ({okPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${okPercentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-600">Risk / Underfed</span>
                <span className="font-black text-rose-600">{underfedCount} ({underfedPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${underfedPercentage}%` }}></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-medium italic">
              * Metric derived from individual intake estimates relative to metabolic body weight requirements.
            </p>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-3">
              <Calendar size={20} className="text-purple-600" />
              Event Timeline
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.slice(0, 15).map(event => (
                <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                      <BarChart3 size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{event.group} Group</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(event.timestamp).toLocaleDateString()} • {event.feedType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-pink-600">{event.totalKg} kg</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Delivered</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400 italic text-sm">
                No events found for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
