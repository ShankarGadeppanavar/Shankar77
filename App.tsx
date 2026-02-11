
import React from 'react';
import { AppState, Pig, FeedEvent, UserRole, PigGroup, Sex, FeedStatus, UserProfile } from './types.ts';
import { loadState, saveState } from './services/storage.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './views/Dashboard.tsx';
import PigRegistry from './views/PigRegistry.tsx';
import FeedingForm from './views/FeedingForm.tsx';
import Reports from './views/Reports.tsx';
import Login from './views/Login.tsx';
import { ADMIN_EMAIL, generateSeedData } from './constants.tsx';
import { Save, ArrowLeft, RotateCcw, Trash2, LogOut, Edit3, Camera, Upload, X } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>(loadState());
  const [activeView, setActiveView] = React.useState('dashboard');
  const [editingPigId, setEditingPigId] = React.useState<string | null>(null);

  // Form state for adding/editing a pig
  const [newPig, setNewPig] = React.useState<Partial<Pig>>({
    tagId: '',
    name: '',
    group: PigGroup.GROWER,
    sex: Sex.MALE,
    isPregnant: false,
    weight: 20,
    breed: 'Yorkshire',
    dob: new Date().toISOString().split('T')[0],
    photoUrl: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Automatically save state whenever it changes
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPig(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

    const underfedCount = event.estimates.filter((e: any) => e.status === FeedStatus.UNDERFED || e.status === FeedStatus.MISSED).length;
    if (underfedCount > 0) {
      console.log(`%c[SYSTEM ALERT] Email sent to ${ADMIN_EMAIL}: ${underfedCount} issues detected in ${event.group} group.`, "color: #e11d48; font-weight: bold;");
    }

    setState(prev => ({
      ...prev,
      pigs: newPigs,
      feedEvents: [event, ...prev.feedEvents]
    }));
  };

  const handleAddOrUpdatePig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPig.tagId || !newPig.name) {
      alert("Please enter both Tag ID and Name.");
      return;
    }

    const finalPhotoUrl = newPig.photoUrl || `https://picsum.photos/seed/${newPig.tagId}/200/200`;

    if (editingPigId) {
      // Update existing
      const updatedPigs = state.pigs.map(p => {
        if (p.id === editingPigId) {
          return {
            ...p,
            tagId: newPig.tagId!,
            name: newPig.name!,
            group: (newPig.group as PigGroup),
            sex: (newPig.sex as Sex),
            weight: newPig.weight || p.weight,
            breed: newPig.breed || p.breed,
            dob: newPig.dob || p.dob,
            isPregnant: !!newPig.isPregnant,
            photoUrl: finalPhotoUrl
          };
        }
        return p;
      });
      setState(prev => ({ ...prev, pigs: updatedPigs }));
    } else {
      // Create new
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
        photoUrl: finalPhotoUrl,
        lastIntakeKg: 0,
        status: FeedStatus.PENDING
      };
      setState(prev => ({ ...prev, pigs: [pigToAdd, ...prev.pigs] }));
    }
    
    // Reset form and view
    resetForm();
    setActiveView('pigs');
  };

  const resetForm = () => {
    setEditingPigId(null);
    setNewPig({ 
      tagId: '',
      name: '',
      group: PigGroup.GROWER, 
      sex: Sex.MALE, 
      isPregnant: false, 
      weight: 20, 
      breed: 'Yorkshire',
      dob: new Date().toISOString().split('T')[0],
      photoUrl: ''
    });
  };

  const handleEditPig = (pig: Pig) => {
    setEditingPigId(pig.id);
    setNewPig({
      tagId: pig.tagId,
      name: pig.name,
      group: pig.group,
      sex: pig.sex,
      isPregnant: pig.isPregnant,
      weight: pig.weight,
      breed: pig.breed,
      dob: pig.dob,
      photoUrl: pig.photoUrl
    });
    setActiveView('add_pig'); 
  };

  const handleResetData = () => {
    const isConfirmed = window.confirm("CRITICAL WARNING: This will permanently delete all feeding events, manual overrides, and custom pig records. The registry will be reset to factory defaults. Are you sure?");
    
    if (isConfirmed) {
      try {
        localStorage.removeItem('liveshock_v1_storage');
        const freshPigs = generateSeedData();
        const freshState: AppState = {
          pigs: freshPigs,
          feedEvents: [],
          currentUser: state.currentUser 
        };
        setState(freshState);
        saveState(freshState);
        setActiveView('dashboard');
        alert("System data has been successfully reset to defaults.");
      } catch (error) {
        console.error("Failed to reset data:", error);
        alert("An error occurred while resetting the system. Please try again.");
      }
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
        return (
          <PigRegistry 
            pigs={state.pigs} 
            onSelect={handleEditPig} 
            onAddPig={() => { resetForm(); setActiveView('add_pig'); }} 
          />
        );
      case 'add_pig':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveView('pigs')} className="flex items-center gap-2 text-slate-500 font-bold">
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-2xl font-bold">{editingPigId ? 'Edit Pig Record' : 'Register New Pig'}</h2>
            </div>
            <form onSubmit={handleAddOrUpdatePig} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
              
              {/* Image Upload Section */}
              <div className="flex flex-col items-center justify-center space-y-4 pb-4 border-b border-slate-50">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-slate-100 ring-4 ring-pink-500/10 border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-pink-300 transition-colors">
                    {newPig.photoUrl ? (
                      <img src={newPig.photoUrl} alt="Pig Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Camera size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Photo</p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-pink-600 text-white p-3 rounded-2xl shadow-xl hover:bg-pink-700 transition-all hover:scale-110 active:scale-95 z-10"
                  >
                    <Upload size={18} />
                  </button>
                  {newPig.photoUrl && (
                    <button 
                      type="button"
                      onClick={() => setNewPig(prev => ({...prev, photoUrl: ''}))}
                      className="absolute -top-2 -right-2 bg-slate-800 text-white p-2 rounded-xl shadow-lg hover:bg-slate-900 transition-all z-10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <p className="text-xs font-medium text-slate-400 text-center max-w-[200px]">
                  {editingPigId ? "Upload a new photo to update identification." : "Add a photo for individual identification in the trough."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Tag ID (Required)</label>
                  <input required type="text" placeholder="e.g. TAG-2045" value={newPig.tagId} onChange={e => setNewPig({...newPig, tagId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-600 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Name / Nickname</label>
                  <input required type="text" placeholder="e.g. Bessie" value={newPig.name} onChange={e => setNewPig({...newPig, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-600 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Group</label>
                  <select value={newPig.group} onChange={e => setNewPig({...newPig, group: e.target.value as PigGroup})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-medium">
                    {Object.values(PigGroup).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input type="number" value={newPig.weight} onChange={e => setNewPig({...newPig, weight: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Breed</label>
                  <input type="text" value={newPig.breed} onChange={e => setNewPig({...newPig, breed: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" value={newPig.dob} onChange={e => setNewPig({...newPig, dob: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-medium" />
                </div>
                <div className="flex flex-col space-y-2 p-2">
                  <span className="text-sm font-bold text-slate-600">Sex</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 font-bold text-sm text-slate-600 cursor-pointer">
                      <input type="radio" name="sex" className="w-4 h-4 accent-pink-600" checked={newPig.sex === Sex.MALE} onChange={() => setNewPig({...newPig, sex: Sex.MALE})} /> Male
                    </label>
                    <label className="flex items-center gap-2 font-bold text-sm text-slate-600 cursor-pointer">
                      <input type="radio" name="sex" className="w-4 h-4 accent-pink-600" checked={newPig.sex === Sex.FEMALE} onChange={() => setNewPig({...newPig, sex: Sex.FEMALE})} /> Female
                    </label>
                  </div>
                </div>
                {newPig.sex === Sex.FEMALE && (
                  <div className="flex items-end pb-4">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm text-slate-600 cursor-pointer w-full">
                      <input type="checkbox" className="w-5 h-5 accent-pink-600" checked={newPig.isPregnant} onChange={e => setNewPig({...newPig, isPregnant: e.target.checked})} /> 
                      Currently Pregnant?
                    </label>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-5 bg-pink-600 text-white rounded-[1.5rem] font-bold text-lg shadow-xl hover:bg-pink-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                <Save size={22} /> {editingPigId ? 'Update Record' : 'Save Pig Record'}
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
                {state.pigs.filter(p => p.status === FeedStatus.UNDERFED || p.status === FeedStatus.MISSED).map(p => (
                  <div key={p.id} className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex gap-4">
                     <div className="w-12 h-12 bg-rose-200 rounded-lg flex items-center justify-center font-bold text-rose-700">!</div>
                     <div>
                       <p className="font-bold text-rose-900">INTAKE ALERT: {p.tagId}</p>
                       <p className="text-sm text-rose-700">Status: <span className="font-bold uppercase tracking-tighter">{p.status}</span></p>
                       <p className="text-xs text-rose-700">Estimated intake ({p.lastIntakeKg.toFixed(2)}kg) is below safety threshold.</p>
                       <p className="text-xs text-rose-400 mt-1">Farm: Pork | Contact: {ADMIN_EMAIL}</p>
                     </div>
                  </div>
                ))}
                {state.pigs.filter(p => p.status === FeedStatus.UNDERFED || p.status === FeedStatus.MISSED).length === 0 && (
                  <p className="text-slate-400 py-12 italic text-center w-full">No active alerts. All animals are feeding well.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'reports':
        return <Reports pigs={state.pigs} feedEvents={state.feedEvents} />;
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
                    type="button"
                    onClick={handleResetData}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors group cursor-pointer"
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
