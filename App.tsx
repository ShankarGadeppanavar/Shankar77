
import React from 'react';
import { AppState, Pig, FeedEvent, UserRole, PigGroup, Sex, FeedStatus, UserProfile } from './types.ts';
import { loadState, saveState } from './services/storage.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './views/Dashboard.tsx';
import PigRegistry from './views/PigRegistry.tsx';
import FeedingForm from './views/FeedingForm.tsx';
import Login from './views/Login.tsx';
import { ADMIN_EMAIL, generateSeedData } from './constants.tsx';
import { Save, ArrowLeft, RotateCcw, Trash2, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(loadState());
  const [activeView, setActiveView] = React.useState('dashboard');
  const [selectedPig, setSelectedPig] = React.useState<Pig | null>(null);

  // Form state for adding a pig
  const [newPig, setNewPig] = React.useState<Partial<Pig>>({
    group: PigGroup.GROWER,
    sex: Sex.MALE,
    isPregnant: false,
    weight: 20,
    breed: 'Yorkshire'
  });

  React.useEffect(() => {
    saveState(state);
  }, [state]);

  const handleLogin = (user: UserProfile) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setState(prev => ({ ...prev, currentUser: null }));
    }
  };

  const handleRecordFeeding = (event: any) => {
    const newPigs = state.pigs.map(p => {
      const estimate = event.estimates.find((e: any) => e.id === p.id);
      if (estimate) {
        return {
          ...p,
          lastIntakeKg: estimate.estimated,
          status: estimate.status
        };
      }
      return p;
    });

    const underfedCount = event.estimates.filter((e: any) => e.status === 'Underfed').length;
    if (underfedCount > 0) {
      console.log(`%c[SYSTEM ALERT] Email sent to ${ADMIN_EMAIL}: ${underfedCount} pigs underfed in ${event.group} group.`, "color: #e11d48; font-weight: bold;");
    }

    setState(prev => ({
      ...prev,
      pigs: newPigs,
      feedEvents: [event, ...prev.feedEvents]
    }));
  };

  const handleAddPig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPig.tagId || !newPig.name) return;

    const pigToAdd: Pig = {
      id: `p-${Date.now()}`,
      tagId: newPig.tagId!,
      name: newPig.name!,
      dob: newPig.dob || new Date().toISOString().split('T')[0],
      group: (newPig.group as PigGroup) || PigGroup.GROWER,
      sex: (newPig.sex as Sex) || Sex.MALE,
      breed: newPig.breed || 'Unknown',
      weight: newPig.weight || 0,
      weightHistory: [{ date: new Date().toISOString(), value: newPig.weight || 0 }],
      isPregnant: !!newPig.isPregnant,
      photoUrl: `https://picsum.photos/seed/${newPig.tagId}/200/200`,
      lastIntakeKg: 0,
      status: FeedStatus.PENDING
    };

    setState(prev => ({
      ...prev,
      pigs: [pigToAdd, ...prev.pigs]
    }));
    setActiveView('pigs');
    setNewPig({ group: PigGroup.GROWER, sex: Sex.MALE, isPregnant: false, weight: 20, breed: 'Yorkshire' });
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset ALL data? This will clear all feeding events and reset the pig list to default. This cannot be undone.")) {
      const freshState: AppState = {
        pigs: generateSeedData(),
        feedEvents: [],
        currentUser: state.currentUser 
      };
      setState(freshState);
      saveState(freshState);
      setActiveView('dashboard');
      alert("System has been reset to factory defaults.");
    }
  };

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard pigs={state.pigs} onNavigate={setActiveView} />;
      case 'pigs':
        return <PigRegistry pigs={state.pigs} onSelect={(p) => setSelectedPig(p)} onAddPig={() => setActiveView('add_pig')} />;
      case 'add_pig':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveView('pigs')} className="flex items-center gap-2 text-slate-500 font-bold">
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-2xl font-bold">Register New Pig</h2>
            </div>
            <form onSubmit={handleAddPig} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Tag ID (Required)</label>
                  <input required type="text" placeholder="e.g. TAG-2045" value={newPig.tagId || ''} onChange={e => setNewPig({...newPig, tagId: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Name / Nickname</label>
                  <input required type="text" placeholder="e.g. Bessie" value={newPig.name || ''} onChange={e => setNewPig({...newPig, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Group</label>
                  <select value={newPig.group} onChange={e => setNewPig({...newPig, group: e.target.value as PigGroup})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none">
                    {Object.values(PigGroup).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input type="number" value={newPig.weight || ''} onChange={e => setNewPig({...newPig, weight: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Breed</label>
                  <input type="text" value={newPig.breed || ''} onChange={e => setNewPig({...newPig, breed: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" value={newPig.dob || ''} onChange={e => setNewPig({...newPig, dob: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" />
                </div>
                <div className="flex items-center gap-6 p-2">
                  <label className="flex items-center gap-2 font-bold text-sm text-slate-600">
                    <input type="radio" name="sex" checked={newPig.sex === Sex.MALE} onChange={() => setNewPig({...newPig, sex: Sex.MALE})} /> Male
                  </label>
                  <label className="flex items-center gap-2 font-bold text-sm text-slate-600">
                    <input type="radio" name="sex" checked={newPig.sex === Sex.FEMALE} onChange={() => setNewPig({...newPig, sex: Sex.FEMALE})} /> Female
                  </label>
                </div>
                {newPig.sex === Sex.FEMALE && (
                  <label className="flex items-center gap-2 p-2 font-bold text-sm text-slate-600">
                    <input type="checkbox" checked={newPig.isPregnant} onChange={e => setNewPig({...newPig, isPregnant: e.target.checked})} /> Pregnant
                  </label>
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                <Save size={20} /> Save Pig Record
              </button>
            </form>
          </div>
        );
      case 'feeding':
        return <FeedingForm pigs={state.pigs} onRecord={handleRecordFeeding} onNavigate={setActiveView} />;
      case 'alerts':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Alert Center</h2>
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-400">
              <p>System notification history for <b>{ADMIN_EMAIL}</b></p>
              <div className="mt-8 space-y-4 text-left max-w-lg mx-auto">
                {state.pigs.filter(p => p.status === 'Underfed').map(p => (
                  <div key={p.id} className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex gap-4">
                     <div className="w-12 h-12 bg-rose-200 rounded-lg flex items-center justify-center font-bold text-rose-700">!</div>
                     <div>
                       <p className="font-bold text-rose-900">INTAKE ALERT: {p.tagId}</p>
                       <p className="text-sm text-rose-700">Estimated intake ({p.lastIntakeKg.toFixed(2)}kg) is below 85% threshold.</p>
                       <p className="text-xs text-rose-400 mt-1">Farm: Pork | Contact: {ADMIN_EMAIL}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Analytics & Reports</h2>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Export CSV</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-300 font-bold uppercase italic tracking-widest">
                 Growth History Chart
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-300 font-bold uppercase italic tracking-widest">
                 Feed Cost Analysis
               </div>
             </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Settings</h2>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <img src={state.currentUser?.photoUrl} className="w-16 h-16 rounded-full border-2 border-white shadow-sm" alt="Profile" />
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{state.currentUser?.name}</p>
                    <p className="text-sm text-slate-500 font-medium">{state.currentUser?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-3 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Primary Contact Email (Alerts)</label>
                <input disabled type="text" value={ADMIN_EMAIL} className="w-full p-4 bg-slate-50 rounded-xl font-medium text-slate-500 border border-slate-200" />
              </div>
              
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold mb-4 text-slate-800">System Controls</h3>
                <div className="space-y-3">
                   <button 
                    onClick={handleResetData}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors group"
                   >
                     <div className="flex items-center gap-3">
                       <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                       <div className="text-left">
                         <p className="font-bold">Reset All Data</p>
                         <p className="text-xs opacity-70">Clear all records and revert to default pigs.</p>
                       </div>
                     </div>
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Help & Documentation</h2>
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
               <h3 className="text-xl font-bold mb-4 text-pink-600">Quick Start Guide for Staff</h3>
               <ol className="list-decimal list-inside space-y-4 text-slate-700">
                 <li><b>Record Feeding:</b> Tap the pink "FEED NOW" button.</li>
                 <li><b>Select Group:</b> Choose which room or group you are feeding.</li>
                 <li><b>Enter Weight:</b> Type the total kilograms delivered to the trough.</li>
                 <li><b>Manual Check:</b> If you saw a pig NOT eating, tap the pencil icon to mark as "Missed".</li>
                 <li><b>Save:</b> The system will handle the math and alert the manager if any pig didn't get enough.</li>
               </ol>
               <div className="mt-8 p-6 bg-pink-50 rounded-2xl border border-pink-100">
                  <p className="font-bold text-pink-900">Need Support?</p>
                  <p className="text-sm text-pink-700">Email: {ADMIN_EMAIL}</p>
               </div>
            </div>
          </div>
        );
      default:
        return <Dashboard pigs={state.pigs} onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} user={state.currentUser}>
      {renderContent()}
    </Layout>
  );
};

export default App;
