import React, { useState } from 'react';

interface DoctorData {
  servicesOffered: string[];
  consultationFee?: number;
  serviceHours?: string;
}

interface ServicesStepProps {
  data: DoctorData;
  updateData: (updates: Partial<DoctorData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ServicesStep: React.FC<ServicesStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const services = [
    {
      id: 'vital_monitoring',
      name: 'Real-Time Vital Monitoring',
      description: 'Continuous monitoring of patient vital signs'
    },
    {
      id: 'consultation',
      name: 'Remote Patient Consultation',
      description: 'Virtual consultations with patients'
    },
    {
      id: 'alert_response',
      name: 'Alert Acknowledgment & Response',
      description: 'Respond to patient alerts and emergencies'
    },
    {
      id: 'medication_management',
      name: 'Medication Management',
      description: 'Manage patient medications and prescriptions'
    },
    {
      id: 'follow_up',
      name: 'Patient Follow-up',
      description: 'Regular follow-up appointments and check-ins'
    },
    {
      id: 'data_analysis',
      name: 'Data Analysis & Reporting',
      description: 'Analyze patient data and generate reports'
    },
    {
      id: 'emergency_response',
      name: 'Emergency Response',
      description: 'Emergency medical response and coordination'
    }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.servicesOffered || data.servicesOffered.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    if (data.consultationFee !== undefined && (data.consultationFee < 0 || data.consultationFee > 10000)) {
      newErrors.consultationFee = 'Please enter a valid consultation fee';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    const currentServices = data.servicesOffered || [];
    if (currentServices.includes(serviceId)) {
      updateData({ 
        servicesOffered: currentServices.filter(id => id !== serviceId) 
      });
    } else {
      updateData({ 
        servicesOffered: [...currentServices, serviceId] 
      });
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Services Offered
        </h2>
        <p className="text-gray-600">
          Select the medical services you provide to patients
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Services * (Choose at least one)
          </label>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  data.servicesOffered?.includes(service.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id={`service-${service.id}`}
                    name="servicesOffered"
                    checked={data.servicesOffered?.includes(service.id) || false}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.services && (
            <p className="mt-2 text-sm text-red-600">{errors.services}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Fee (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                ZMW
              </span>
              <input
                type="number"
                id="consultationFee"
                name="consultationFee"
                value={data.consultationFee || ''}
                onChange={(e) => updateData({ consultationFee: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.consultationFee ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                max="10000"
                step="0.01"
              />
            </div>
            {errors.consultationFee && (
              <p className="mt-1 text-sm text-red-600">{errors.consultationFee}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if not applicable
            </p>
          </div>

          <div>
            <label htmlFor="serviceHours" className="block text-sm font-medium text-gray-700 mb-1">
              Service Hours (Optional)
            </label>
            <input
              type="text"
              id="serviceHours"
              name="serviceHours"
              value={data.serviceHours || ''}
              onChange={(e) => updateData({ serviceHours: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mon-Fri 9AM-5PM"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your typical availability for consultations
            </p>
          </div>
        </div>

        {/* Selected Services Summary */}
        {data.servicesOffered && data.servicesOffered.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Selected Services ({data.servicesOffered.length})
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              {data.servicesOffered.map((serviceId) => (
                <li key={serviceId}>
                  • {getServiceName(serviceId)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 Service Information
          </h4>
          <p className="text-sm text-blue-800">
            The services you select will be displayed to patients when they search for doctors. 
            You can update these settings later in your profile.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Previous
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue to Professional Info
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServicesStep;
