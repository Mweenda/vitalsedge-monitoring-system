import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logAudit } from '../lib/audit';
import { useFirebase } from './FirebaseProvider';
import { UserRole } from '../types';

interface Clinician {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | 'CARDIOLOGIST' | 'NURSE' | 'PATIENT_OBSERVER';
  clinicId: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  createdAt: string;
}

const AdminClinicianManagement: React.FC = () => {
  const { userData, degraded } = useFirebase();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [newClinician, setNewClinician] = useState({
    email: '',
    fullName: '',
    role: 'CARDIOLOGIST' as Clinician['role'],
    clinicId: auth.currentUser?.uid || '',
    status: 'PENDING' as Clinician['status']
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinician));
      setClinicians(data);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching clinicians:', err);
      setError('Failed to load clinicians');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddClinician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (degraded) {
      setError('Clinician management is unavailable while the app is in degraded mode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, you would use Firebase Admin SDK or a Cloud Function to create the user account
      // For this demo, we'll just add the user document to Firestore
      await addDoc(collection(db, 'users'), {
        ...newClinician,
        createdAt: new Date().toISOString(),
        status: 'PENDING'
      });

      // Log audit action
      await logAudit({
        db,
        action: 'CREATE_CLINICIAN',
        actorId: auth.currentUser?.uid,
        actorRole: userData?.role,
        targetId: newClinician.email,
        metadata: { fullName: newClinician.fullName, role: newClinician.role },
      });

      setIsAdding(false);
      setNewClinician({ email: '', fullName: '', role: 'CARDIOLOGIST', clinicId: auth.currentUser?.uid || '', status: 'PENDING' });
    } catch (err: any) {
      console.error('Error adding clinician:', err);
      setError(err.message || 'Failed to add clinician');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (clinician: Clinician) => {
    if (degraded) {
      setError('Clinician management is unavailable while the app is in degraded mode.');
      return;
    }
    try {
      const newStatus = clinician.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateDoc(doc(db, 'users', clinician.id), { status: newStatus });
      
      await logAudit({
        db,
        action: 'UPDATE_CLINICIAN_STATUS',
        actorId: auth.currentUser?.uid,
        actorRole: userData?.role,
        targetId: clinician.email,
        metadata: { oldStatus: clinician.status, newStatus },
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteClinician = async (clinician: Clinician) => {
    if (!window.confirm(`Are you sure you want to remove ${clinician.fullName}?`)) return;
    if (degraded) {
      setError('Clinician management is unavailable while the app is in degraded mode.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', clinician.id));
      
      await logAudit({
        db,
        action: 'DELETE_CLINICIAN',
        actorId: auth.currentUser?.uid,
        actorRole: userData?.role,
        targetId: clinician.email,
        metadata: { fullName: clinician.fullName },
      });
    } catch (err) {
      console.error('Error deleting clinician:', err);
    }
  };

  const filteredClinicians = clinicians.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Clinician Management</h2>
          <p className="text-slate-400 text-sm mt-1">Manage healthcare providers and system access.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Clinician
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Clinicians" value={clinicians.length} icon={<Users className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Active" value={clinicians.filter(c => c.status === 'ACTIVE').length} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Pending" value={clinicians.filter(c => c.status === 'PENDING').length} icon={<Loader2 className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Inactive" value={clinicians.filter(c => c.status === 'INACTIVE').length} icon={<XCircle className="w-5 h-5 text-slate-500" />} />
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Clinician Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/30">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinician</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinic</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredClinicians.map((clinician) => (
              <tr key={clinician.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-emerald-400">
                      {clinician.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{clinician.fullName}</p>
                      <p className="text-xs text-slate-500">{clinician.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    {clinician.role.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="w-3 h-3" />
                    {clinician.clinicId}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    clinician.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    clinician.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {clinician.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleStatus(clinician)}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={clinician.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {clinician.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteClinician(clinician)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClinicians.length === 0 && !isLoading && (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No clinicians found.</p>
          </div>
        )}
      </div>

      {/* Add Clinician Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Add New Clinician</h3>
              <p className="text-slate-400 text-sm mb-8">Invite a healthcare provider to the platform.</p>

              <form onSubmit={handleAddClinician} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={newClinician.fullName}
                      onChange={e => setNewClinician({...newClinician, fullName: e.target.value})}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={newClinician.email}
                      onChange={e => setNewClinician({...newClinician, email: e.target.value})}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="clinician@hospital.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                    <select 
                      value={newClinician.role}
                      onChange={e => setNewClinician({...newClinician, role: e.target.value as Clinician['role']})}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                      <option value="CARDIOLOGIST">Cardiologist</option>
                      <option value="NURSE">Nurse</option>
                      <option value="CLINIC_MANAGER">Clinic Manager</option>
                      <option value="PATIENT_OBSERVER">Patient Observer</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinic</label>
                    <select 
                      value={newClinician.clinicId}
                      onChange={e => setNewClinician({...newClinician, clinicId: e.target.value})}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                      <option value="CLINIC-001">Metro Health</option>
                      <option value="CLINIC-002">Westside Medical</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Clinician'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </div>
);

export default AdminClinicianManagement;
