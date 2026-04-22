import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { PatientData, Anomaly } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PatientRosterProps {
  patients: PatientData[];
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
  alerts: Anomaly[];
}

interface SortOption {
  key: keyof PatientData | 'alertCount' | 'lastActivity';
  label: string;
  direction: 'asc' | 'desc';
}

export const PatientRoster: React.FC<PatientRosterProps> = ({
  patients,
  selectedPatientId,
  onPatientSelect,
  alerts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>({
    key: 'lastName',
    label: 'Name',
    direction: 'asc'
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;

  // Get unique conditions for filter
  const conditions = useMemo(() => {
    const uniqueConditions = Array.from(new Set(patients.map(p => p.condition)));
    return uniqueConditions.sort();
  }, [patients]);

  // Calculate alert count for each patient
  const patientAlertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(alert => {
      counts[alert.patientId] = (counts[alert.patientId] || 0) + 1;
    });
    return counts;
  }, [alerts]);

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Condition filter
      const matchesCondition = filterCondition === 'all' || patient.condition === filterCondition;

      // Status filter
      const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;

      return matchesSearch && matchesCondition && matchesStatus;
    });

    // Sort patients
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.key) {
        case 'alertCount':
          aValue = patientAlertCounts[a.id] || 0;
          bValue = patientAlertCounts[b.id] || 0;
          break;
        case 'lastName':
          aValue = `${a.lastName}, ${a.firstName}`.toLowerCase();
          bValue = `${b.lastName}, ${b.firstName}`.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = a[sortBy.key as keyof PatientData];
          bValue = b[sortBy.key as keyof PatientData];
      }

      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [patients, searchTerm, filterCondition, filterStatus, sortBy, patientAlertCounts]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);
  const paginatedPatients = filteredAndSortedPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCondition, filterStatus, sortBy]);

  const sortOptions: SortOption[] = [
    { key: 'lastName', label: 'Name', direction: 'asc' },
    { key: 'lastName', label: 'Name (Z-A)', direction: 'desc' },
    { key: 'createdAt', label: 'Enrollment Date', direction: 'desc' },
    { key: 'createdAt', label: 'Enrollment Date (Oldest)', direction: 'asc' },
    { key: 'updatedAt', label: 'Last Updated', direction: 'desc' },
    { key: 'alertCount', label: 'Alert Count', direction: 'desc' },
    { key: 'condition', label: 'Condition', direction: 'asc' }
  ];

  const getStatusColor = (status: PatientData['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'discharged': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      'CHF': 'bg-purple-100 text-purple-800',
      'COPD': 'bg-orange-100 text-orange-800',
      'Diabetes': 'bg-blue-100 text-blue-800',
      'Hypertension': 'bg-red-100 text-red-800',
      'Post-Op': 'bg-green-100 text-green-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center space-x-2">
            <Users className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Patients</h2>
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
              {filteredAndSortedPatients.length}{' '}
              {filteredAndSortedPatients.length === 1 ? 'patient' : 'patients'}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              id="patient-roster-search"
              name="patientRosterSearch"
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <select
                id="patient-roster-condition-filter"
                name="patientRosterConditionFilter"
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-2 pl-10 pr-8 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Conditions</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" aria-hidden />
              <select
                id="patient-roster-status-filter"
                name="patientRosterStatusFilter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-2 pl-10 pr-8 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="discharged">Discharged</option>
                <option value="transferred">Transferred</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            </div>

            <div className="relative sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                aria-label="Sort patient list"
                aria-expanded={showSortMenu}
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  {sortBy.label}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={`${option.key}-${option.direction}`}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700 ${
                          sortBy.key === option.key && sortBy.direction === option.direction
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="min-h-0 flex-1 divide-y divide-gray-200 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {paginatedPatients.map((patient) => {
            const alertCount = patientAlertCounts[patient.id] || 0;
            const isSelected = patient.id === selectedPatientId;

            return (
              <motion.div
                key={patient.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={clsx(
                  "relative cursor-pointer px-4 py-4 transition-all duration-200",
                  "hover:bg-white/40 dark:hover:bg-white/5 backdrop-blur-sm",
                  isSelected ? "bg-blue-50/60 dark:bg-blue-900/20 border-l-4 border-blue-500" : "border-l-4 border-transparent"
                )}
                onClick={() => onPatientSelect(patient.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      MRN: {patient.mrn} · Updated {new Date(patient.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getConditionColor(patient.condition)}`}>
                        {patient.condition}
                      </span>
                    </div>
                  </div>

                  {/* Alert Status */}
                  <div className="flex shrink-0 items-center">
                    {alertCount > 0 ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm shadow-red-500/20">
                        <span className="text-[10px] font-bold">{alertCount}</span>
                      </div>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {paginatedPatients.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>No patients found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * patientsPerPage) + 1} to {Math.min(currentPage * patientsPerPage, filteredAndSortedPatients.length)} of {filteredAndSortedPatients.length} patients
            </div>
            
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
