import React, { useState } from 'react';

interface DoctorData {
  specialization: string;
  licenseNumber: string;
  licenseIssuingBody: string;
  yearsOfExperience: number;
  qualifications: string;
}

interface SpecializationStepProps {
  data: DoctorData;
  updateData: (updates: Partial<DoctorData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const SpecializationStep: React.FC<SpecializationStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [otherSpecialization, setOtherSpecialization] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const specializations = [
    'Cardiology',
    'Respiratory Medicine (Pulmonology)',
    'Endocrinology',
    'Nephrology',
    'General Practice',
    'Internal Medicine',
    'Emergency Medicine',
    'Other'
  ];

  const issuingBodies = [
    'Medical Council of Zambia',
    'Health Professions Council of Zambia',
    'Medical and Dental Council',
    'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.specialization) {
      newErrors.specialization = 'Please select a specialization';
    } else if (data.specialization === 'Other' && !otherSpecialization.trim()) {
      newErrors.specialization = 'Please specify your specialization';
    }

    if (!data.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!data.licenseIssuingBody) {
      newErrors.licenseIssuingBody = 'Please select license issuing body';
    }

    if (!data.yearsOfExperience || data.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = 'Please enter valid years of experience';
    }

    if (!data.qualifications.trim()) {
      newErrors.qualifications = 'Professional qualifications are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If "Other" specialization is selected, use the custom value
    const finalSpecialization = data.specialization === 'Other' 
      ? otherSpecialization 
      : data.specialization;
    
    if (validateForm()) {
      updateData({ specialization: finalSpecialization });
      onNext();
    }
  };

  const handleSpecializationChange = (value: string) => {
    updateData({ specialization: value });
    if (value !== 'Other') {
      setOtherSpecialization('');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Specialization & Credentials
        </h2>
        <p className="text-gray-600">
          Tell us about your medical specialization and professional credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Specialization *
          </label>
          <select
            id="specialization"
            name="specialization"
            value={data.specialization}
            onChange={(e) => handleSpecializationChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.specialization ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select your specialization</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          {errors.specialization && (
            <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
          )}
        </div>

        {data.specialization === 'Other' && (
          <div>
            <label htmlFor="otherSpecialization" className="block text-sm font-medium text-gray-700 mb-1">
              Please specify your specialization *
            </label>
            <input
              type="text"
              id="otherSpecialization"
              name="otherSpecialization"
              value={otherSpecialization}
              onChange={(e) => setOtherSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your specialization"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
              License/Registration Number *
            </label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={data.licenseNumber}
              onChange={(e) => updateData({ licenseNumber: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., ZM/MED/2023/1234"
            />
            {errors.licenseNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="licenseIssuingBody" className="block text-sm font-medium text-gray-700 mb-1">
              License Issuing Body *
            </label>
            <select
              id="licenseIssuingBody"
              name="licenseIssuingBody"
              value={data.licenseIssuingBody}
              onChange={(e) => updateData({ licenseIssuingBody: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.licenseIssuingBody ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select issuing body</option>
              {issuingBodies.map((body) => (
                <option key={body} value={body}>
                  {body}
                </option>
              ))}
            </select>
            {errors.licenseIssuingBody && (
              <p className="mt-1 text-sm text-red-600">{errors.licenseIssuingBody}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
            Years of Experience *
          </label>
          <input
            type="number"
            id="yearsOfExperience"
            name="yearsOfExperience"
            value={data.yearsOfExperience || ''}
            onChange={(e) => updateData({ yearsOfExperience: parseInt(e.target.value) || 0 })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 5"
            min="0"
            max="50"
          />
          {errors.yearsOfExperience && (
            <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
          )}
        </div>

        <div>
          <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
            Professional Qualifications *
          </label>
          <textarea
            id="qualifications"
            name="qualifications"
            value={data.qualifications}
            onChange={(e) => updateData({ qualifications: e.target.value })}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.qualifications ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., MBChB, MMed (Internal Medicine), FCP(SA)"
          />
          {errors.qualifications && (
            <p className="mt-1 text-sm text-red-600">{errors.qualifications}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            List your medical degrees, certifications, and specializations
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            📋 Credential Verification
          </h4>
          <p className="text-sm text-yellow-800">
            Your medical credentials will be verified by the hospital administration. 
            Please ensure all information is accurate and matches your official documents.
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
            Continue to Services
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecializationStep;
