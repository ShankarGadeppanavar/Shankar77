
import React from 'react';
import { Pig, PigGroup, FeedType, FeedStatus, GroupProfile } from '../types.ts';
import { FEED_TYPES, GROUP_PROFILES } from '../constants.tsx';
import { Check, X, Info, Utensils, ArrowRight, Scale, AlertCircle, ChevronLeft } from 'lucide-react';

interface FeedingFormProps {
  pigs: Pig[];
  onRecord: (event: any) => void;
  onNavigate: (view: string) => void;
}

const FeedingForm: React.FC<FeedingFormProps> = ({ pigs, onRecord, onNavigate }) => {
  const [step, setStep] = React.useState(1);
  const [selectedGroup, setSelectedGroup] = React.useState<PigGroup | null>(null);
  const [selectedFeed, setSelectedFeed] = React.useState<string>(FEED_TYPES[0].id);
  const [totalKg, setTotalKg] = React.useState<number>(0);
  const [overrides, setOverrides] = React.useState<Record<string, 'ate' | 'missed' | 'partial'>>({});
  const [showOverrides, setShowOverrides] = React.useState(false);

  const groupPigs = selectedGroup ? pigs.filter(p => p.group === selectedGroup) : [];
  const profile = selectedGroup ? GROUP_PROFILES.find(g => g.id === selectedGroup) : null;
  
  // Theoretical total requirement for the group
  const totalWeightInGroup = groupPigs.reduce((acc, p) => acc + p.weight, 0);
  const theoreticalRequiredKg = profile ? totalWeightInGroup * profile.baseRationPerKg : 0;

  /**
   * Refined Estimation Logic:
   * 1. Calculate "Effective Feeding Weight" (Sum of weights adjusted by multiplier).
   * 2. Distribute the total available feed (totalKg) among those who ate, proportional to their body weight.
   */
  const calculateEstimates = () => {
    if (!selectedGroup || !profile || groupPigs.length === 0) return [];
    
    // Step 1: Sum up the weighted presence of all pigs in the trough
    const effectiveWeightSum = groupPigs.reduce((acc, p) => {
      let multiplier = 1.0;
      if (overrides[p.id] === 'missed') multiplier = 0;
      if (overrides[p.id] === 'partial') multiplier = 0.5;
      return acc + (p.weight * multiplier);
    }, 0);

    return groupPigs.map(p => {
      const pRequired = p.weight * profile.baseRationPerKg;
      let multiplier = 1.0;
      if (overrides[p.id] === 'missed') multiplier = 0;
      if (overrides[p.id] === 'partial') multiplier = 0.5;

      // Step 2: Calculate share based on individual weighted presence vs total weighted presence
      const estimated = effectiveWeightSum > 0 
        ? (totalKg * (p.weight * multiplier) / effectiveWeightSum)
        : 0;
      
      // Step 3: Determine health status
      let status = FeedStatus.OK;
      const coverage = pRequired > 0 ? (estimated / pRequired) : 1;

      if (overrides[p.id] === 'missed') {
        status = FeedStatus.MISSED;
      } else if (coverage < 0.85) {
        status = FeedStatus.UNDERFED;
      }
      
      return { 
        ...p, 
        estimated, 
        status, 
        pRequired, 
        coverage: Math.min(Math.round(coverage * 100), 100)
      };
    });
  };

  const handleSubmit = () => {
    if (totalKg <= 0) {
      alert("Please enter a valid feed weight.");
      return;
    }

    const estimates = calculateEstimates();
    const event = {
      id: `f-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      group: selectedGroup!,
      feedType: FEED_TYPES.find(f => f.id === selectedFeed)?.name || 'Unknown',
      totalKg,
      method: 'Trough Distribution',
      recordedBy: 'Farm Admin',
      overrides,
      estimates
    };
    
    onRecord(event);
    onNavigate('dashboard');
  };

  const resetSelection = () => {
    setSelectedGroup(null);
    setTotalKg(0);
    setOverrides({});
    setStep(1);
  };

  // View: Select Group and Enter Amount
  if (step === 1) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header>
          <h2 className="text-2xl font-bold">Log Feeding Session</h2>
          <p className="text-slate-500">Choose a livestock group and enter the total mass of feed added.</p>
        </header>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {GROUP_PROFILES.map(group => {
            const count = pigs.filter(p => p.group === group.id).length;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`p-5 rounded-[2rem] border-2 transition-all text-left group flex flex-col justify-between h-32 ${
                  selectedGroup === group.id 
                  ? 'border-pink-600 bg-pink-50 ring-4 ring-pink-500/10 shadow-lg shadow-pink-200/50' 
                  : 'border-white bg-white shadow-sm hover:border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl w-fit ${selectedGroup === group.id ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Utensils size={18} />
                </div>
                <div>
                  <p className={`font-bold ${selectedGroup === group.id ? 'text-pink-600' : 'text-slate-700'}`}>{group.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{count} PIGS</p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedGroup && (
          <div className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Formulation</label>
                  <div className="grid grid-cols-1 gap-2">
                    {FEED_TYPES.map(ft => (
                      <button
                        key={ft.id}
                        onClick={() => setSelectedFeed(ft.id)}
                        className={`p-4 text-left rounded-2xl border-2 transition-all font-bold text-sm ${
                          selectedFeed === ft.id ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {ft.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Total Delivered (kg)</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-600 transition-colors">
                      <Scale size={24} />
                    </div>
                    <input 
                      type="number" 
                      autoFocus
                      value={totalKg || ''}
                      onChange={(e) => setTotalKg(Math.max(0, parseFloat(e.target.value)))}
                      placeholder="0.00"
                      className="w-full pl-16 pr-8 py-6 rounded-[1.5rem] bg-slate-50 border-none ring-2 ring-slate-100 focus:ring-4 focus:ring-pink-600 outline-none font-black text-3xl transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target for {groupPigs.length} Animals</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{theoreticalRequiredKg.toFixed(1)}</span>
                    <span className="text-lg font-bold text-slate-400">kg</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                      <span>Metabolic Base: {profile?.baseRationPerKg} kg/kg BW</span>
                    </div>
                    <div className={`p-4 rounded-xl border-2 text-sm font-bold flex items-center gap-3 ${
                      (totalKg || 0) < theoreticalRequiredKg ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }`}>
                      <Info size={18} />
                      {totalKg < theoreticalRequiredKg 
                        ? `Deficit of ${(theoreticalRequiredKg - totalKg).toFixed(1)}kg detected.` 
                        : "Daily target reached."}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Utensils size={180} />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={totalKg <= 0}
              className="w-full py-6 bg-pink-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-pink-200 disabled:opacity-50 disabled:grayscale hover:bg-pink-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              RUN ESTIMATION ENGINE
              <ArrowRight size={22} />
            </button>
          </div>
        )}
      </div>
    );
  }

  const estimates = calculateEstimates();
  const problemCount = estimates.filter(p => p.status !== FeedStatus.OK).length;

  // View: Review Individual Estimates & Overrides
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep(1)} className="p-3 bg-white text-slate-500 rounded-2xl border border-slate-100 shadow-sm hover:text-pink-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Simulation Review</h2>
            <p className="text-slate-500">{selectedGroup} — {totalKg}kg total</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <Scale size={18} className="text-slate-400" />
           <span className="text-sm font-bold text-slate-600">Avg Intake: {(totalKg / (groupPigs.length || 1)).toFixed(2)} kg</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Individual distribution pool</p>
              <button 
                onClick={() => setShowOverrides(!showOverrides)}
                className={`text-xs px-5 py-2.5 rounded-xl font-bold uppercase transition-all flex items-center gap-2 ${
                  showOverrides ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {showOverrides ? 'Lock Manual Mode' : 'Manual Override'}
              </button>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {estimates.map(p => (
                <div key={p.id} className={`p-5 flex items-center justify-between transition-all ${
                  overrides[p.id] === 'missed' ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={p.photoUrl} className="w-14 h-14 rounded-2xl border-2 border-white shadow-md object-cover" />
                      {overrides[p.id] === 'missed' && (
                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full border-2 border-white">
                          <X size={10} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">{p.tagId}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Weight: {p.weight}kg</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">•</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Req: {p.pRequired.toFixed(2)}kg</span>
                      </div>
                    </div>
                  </div>
                  
                  {showOverrides ? (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                      <button 
                        onClick={() => setOverrides({...overrides, [p.id]: 'ate'})}
                        className={`px-4 py-2.5 rounded-xl transition-all font-bold text-xs ${overrides[p.id] === 'ate' || !overrides[p.id] ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        ATE
                      </button>
                      <button 
                        onClick={() => setOverrides({...overrides, [p.id]: 'partial'})}
                        className={`px-4 py-2.5 rounded-xl transition-all font-bold text-xs ${overrides[p.id] === 'partial' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        HALF
                      </button>
                      <button 
                        onClick={() => setOverrides({...overrides, [p.id]: 'missed'})}
                        className={`px-4 py-2.5 rounded-xl transition-all font-bold text-xs ${overrides[p.id] === 'missed' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        MISSED
                      </button>
                    </div>
                  ) : (
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-2">
                         <p className={`text-lg font-black ${p.status === FeedStatus.OK ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {p.estimated.toFixed(2)} <span className="text-xs">kg</span>
                         </p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                           <div className={`h-full transition-all duration-700 ${p.coverage >= 85 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${p.coverage}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.coverage >= 85 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {p.coverage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <AlertCircle size={22} className="text-pink-600" />
              Confirmation
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm font-medium">Group</span>
                  <span className="font-bold text-slate-800">{selectedGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm font-medium">Feed Type</span>
                  <span className="font-bold text-slate-800">{FEED_TYPES.find(f => f.id === selectedFeed)?.name}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-slate-900 text-sm font-black">Total Weight</span>
                  <span className="font-black text-2xl text-pink-600">{totalKg} kg</span>
                </div>
              </div>

              {problemCount > 0 ? (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="font-black text-rose-700 text-sm">{problemCount} CONCERNS</p>
                    <p className="text-xs text-rose-600 font-medium">Manager will be notified of individual deficits.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Check size={20} />
                  </div>
                  <div>
                    <p className="font-black text-emerald-700 text-sm">OPTIMAL SPREAD</p>
                    <p className="text-xs text-emerald-600 font-medium">Herd intake satisfies metabolic targets.</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xl shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              SAVE RECORDS
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-5 uppercase font-black tracking-[0.2em]">
              Authorized Session Signature Required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedingForm;
