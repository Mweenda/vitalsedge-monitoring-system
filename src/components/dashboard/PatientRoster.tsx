import React, { useState } from 'react';
import { Search, Filter, MoreVertical, User, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, Card } from '../common';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'critical';
  lastVitalCheck: string;
  location: string;
  primaryCondition: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1-555-0123',
    status: 'active',
    lastVitalCheck: '2 hours ago',
    location: 'Room 204, Ward A',
    primaryCondition: 'Hypertension',
    riskLevel: 'medium'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.c@email.com',
    phone: '+1-555-0124',
    status: 'critical',
    lastVitalCheck: '5 minutes ago',
    location: 'ICU Room 3',
    primaryCondition: 'Post-surgery recovery',
    riskLevel: 'high'
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '+1-555-0125',
    status: 'active',
    lastVitalCheck: '1 hour ago',
    location: 'Room 156, Ward B',
    primaryCondition: 'Diabetes Type 2',
    riskLevel: 'low'
  }
];

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-500'
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500'
  },
  critical: {
    label: 'Critical',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-500'
  }
};

const riskConfig = {
  low: {
    label: 'Low Risk',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  medium: {
    label: 'Medium Risk',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  high: {
    label: 'High Risk',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  }
};

export const PatientRoster: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id));
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Patient Roster</h2>
        <Button variant="outline" size="sm">
          Add Patient
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedPatients.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-cyan-50 rounded-lg">
          <span className="text-sm text-cyan-800">
            {selectedPatients.length} patient{selectedPatients.length > 1 ? 's' : ''} selected
          </span>
          <Button variant="primary" size="sm">
            Send Alert
          </Button>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      )}

      {/* Patient List */}
      <div className="space-y-4">
        {/* Table Header */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-t-lg border border-gray-200">
          <input
            type="checkbox"
            checked={selectedPatients.length === filteredPatients.length}
            onChange={handleSelectAll}
            className="rounded border-gray-300"
          />
          <div className="flex-1 text-sm font-medium text-gray-700">Patient</div>
          <div className="w-24 text-sm font-medium text-gray-700">Status</div>
          <div className="w-24 text-sm font-medium text-gray-700">Risk Level</div>
          <div className="w-32 text-sm font-medium text-gray-700">Last Check</div>
          <div className="w-2"></div>
        </div>

        {/* Patient Rows */}
        {filteredPatients.map((patient) => {
          const status = statusConfig[patient.status];
          const risk = riskConfig[patient.riskLevel];
          const isSelected = selectedPatients.includes(patient.id);

          return (
            <div
              key={patient.id}
              className={clsx(
                'flex items-center gap-4 p-4 border border-gray-200 hover:bg-gray-50 transition-colors',
                isSelected && 'bg-cyan-50 border-cyan-200'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectPatient(patient.id)}
                className="rounded border-gray-300"
              />
              
              {/* Patient Info */}
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{patient.location}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Primary: {patient.primaryCondition}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="w-24">
                <span className={clsx('inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                  <span className={clsx('w-2 h-2 rounded-full', status.dotColor)}></span>
                  {status.label}
                </span>
              </div>

              {/* Risk Level */}
              <div className="w-24">
                <span className={clsx('px-2 py-1 rounded text-xs font-medium', risk.bgColor, risk.color)}>
                  {risk.label}
                </span>
              </div>

              {/* Last Check */}
              <div className="w-32 text-sm text-gray-600">
                {patient.lastVitalCheck}
              </div>

              {/* Actions */}
              <div className="w-2">
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </Card>
  );
};
