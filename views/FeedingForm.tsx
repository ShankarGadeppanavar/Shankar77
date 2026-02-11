
import React from 'react';
import { Pig, PigGroup, FeedType, FeedStatus, GroupProfile } from '../types.ts';
import { FEED_TYPES, GROUP_PROFILES } from '../constants.tsx';
import { Check, X, Info, Utensils } from 'lucide-react';

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
  
  // Estimation Algorithm Logic
  const calculateEstimates = () => {
    if (!selectedGroup) return [];
    
    const profile = GROUP_PROFILES.find(g => g.id === selectedGroup)!;
    // Calculate total required capacity for this group based on body weight
    const totalRequiredKg = groupPigs.reduce((acc, p) => acc + (p.weight * profile.baseRationPerKg), 0);

    return groupPigs.map(p => {
      const pRequired = p.weight * profile.baseRationPerKg;
      // Proportional distribution adjusted by manual overrides
      let multiplier = 1.0;
      if (overrides[p.id] === 'missed') multiplier = 0;
      if (overrides[p.id] === 'partial') multiplier = 0.5;
      
      const estimated = (totalKg * (pRequired / totalRequiredKg)) * multiplier;
      const status = estimated < (pRequired * 0.85) ? FeedStatus.UNDERFED : FeedStatus.OK;
      
      return { ...p, estimated, status };
    });
  };

  const handleSubmit = () => {
    const estimates = calculateEstimates();
    const event = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      group: selectedGroup,
      feedType: selectedFeed,
      totalKg,
      method: 'Manual Trough',
      recordedBy: 'Admin User',
      overrides,
      estimates
    };
    onRecord(event);
    onNavigate('dashboard');
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">New Feed Event</h2>
        <p className="text-slate-500">Step 1: Select Group & Quantity</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GROUP_PROFILES.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedGroup === group.id ? 'border-pink-600 bg-pink-50' : 'border-slate-100 bg-white'
              }`}
            >
              <p className="font-bold">{group.name}</p>
              <p className="text-xs text-slate-400">{pigs.filter(p => p.group === group.id).length} Pigs</p>
            </button>
          ))}
        </div>

        {selectedGroup && (
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Feed Type</label>
              <select 
                value={selectedFeed}
                onChange={(e) => setSelectedFeed(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-pink-600 font-medium"
              >
                {FEED_TYPES.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Total Quantity (kg)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={totalKg || ''}
                  onChange={(e) => setTotalKg(parseFloat(e.target.value))}
                  placeholder="Enter kg..."
                  className="flex-1 p-4 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-pink-600 font-bold text-lg"
                />
                <button 
                  onClick={() => setStep(2)}
                  disabled={totalKg <= 0}
                  className="bg-pink-600 text-white px-8 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:grayscale"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review Estimates</h2>
        <button onClick={() => setStep(1)} className="text-pink-600 font-bold text-sm">BACK</button>
      </div>

      <div className="bg-slate-100 p-4 rounded-xl flex items-center gap-4 text-sm font-medium">
        <div className="bg-white p-2 rounded-lg"><Utensils size={16} /></div>
        <p>{totalKg} kg of {FEED_TYPES.find(f => f.id === selectedFeed)?.name} for {selectedGroup}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase">Individual Estimation</p>
          <button 
            onClick={() => setShowOverrides(!showOverrides)}
            className="text-[10px] px-2 py-1 bg-slate-200 rounded font-bold uppercase"
          >
            {showOverrides ? 'Hide Manual' : 'Override Status'}
          </button>
        </div>
        
        <div className="divide-y divide-slate-50">
          {calculateEstimates().map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={p.photoUrl} className="w-8 h-8 rounded-full border border-slate-100" />
                <div>
                  <p className="text-sm font-bold">{p.tagId}</p>
                  <p className="text-[10px] text-slate-400">{p.weight} kg</p>
                </div>
              </div>
              
              {showOverrides ? (
                <div className="flex gap-1">
                  <button 
                    onClick={() => setOverrides({...overrides, [p.id]: 'ate'})}
                    className={`p-2 rounded-lg ${overrides[p.id] === 'ate' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => setOverrides({...overrides, [p.id]: 'partial'})}
                    className={`p-2 rounded-lg ${overrides[p.id] === 'partial' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <Info size={16} />
                  </button>
                  <button 
                    onClick={() => setOverrides({...overrides, [p.id]: 'missed'})}
                    className={`p-2 rounded-lg ${overrides[p.id] === 'missed' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-bold">{p.estimated.toFixed(2)} kg</p>
                  <span className={`text-[10px] font-bold px-1 rounded ${p.status === FeedStatus.OK ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {p.status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full py-5 bg-pink-600 text-white rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3"
      >
        <Utensils />
        RECORD FEEDING
      </button>
    </div>
  );
};

export default FeedingForm;
