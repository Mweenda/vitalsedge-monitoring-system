import React, { useState } from 'react';

interface DoctorData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  hospitalId: string;
  department?: string;
  ward?: string;
  specialization: string;
  licenseNumber: string;
  licenseIssuingBody: string;
  yearsOfExperience: number;
  qualifications: string;
  servicesOffered: string[];
  consultationFee?: number;
  serviceHours?: string;
  biography: string;
  profileImageUrl?: string;
  languages: string[];
  availabilityStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PART_TIME';
}

interface ConfirmationStepProps {
  data: DoctorData;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  data,
  onPrev,
  onSubmit,
  loading,
  error
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToVerification, setAgreedToVerification] = useState(false);

  const hospitals: Record<string, string> = {
    'maina_soko': 'Maina Soko Medical Centre',
    'uth': 'University Teaching Hospital',
    'chilenje': 'Chilenje Level 1 Hospital'
  };

  const getServiceName = (serviceId: string): string => {
    const services: Record<string, string> = {
      'vital_monitoring': 'Real-Time Vital Monitoring',
      'consultation': 'Remote Patient Consultation',
      'alert_response': 'Alert Acknowledgment & Response',
      'medication_management': 'Medication Management',
      'follow_up': 'Patient Follow-up',
      'data_analysis': 'Data Analysis & Reporting',
      'emergency_response': 'Emergency Response'
    };
    return services[serviceId] || serviceId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreedToTerms && agreedToPrivacy && agreedToVerification) {
      onSubmit();
    }
  };

  const isFormValid = agreedToTerms && agreedToPrivacy && agreedToVerification;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review & Confirm
        </h2>
        <p className="text-gray-600">
          Please review your information before submitting your registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span>
              <p className="text-gray-600">Dr. {data.firstName} {data.lastName}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-gray-600">{data.email}</p>
            </div>
            <div>
              <span className="font-medium">Phone:</span>
              <p className="text-gray-600">{data.phone}</p>
            </div>
            <div>
              <span className="font-medium">Availability:</span>
              <p className="text-gray-600 capitalize">{data.availabilityStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Hospital Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Hospital Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Hospital:</span>
              <p className="text-gray-600">{hospitals[data.hospitalId] || data.hospitalId}</p>
            </div>
            {data.department && (
              <div>
                <span className="font-medium">Department:</span>
                <p className="text-gray-600">{data.department}</p>
              </div>
            )}
            {data.ward && (
              <div>
                <span className="font-medium">Ward/Unit:</span>
                <p className="text-gray-600">{data.ward}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Specialization:</span>
              <p className="text-gray-600">{data.specialization}</p>
            </div>
            <div>
              <span className="font-medium">License Number:</span>
              <p className="text-gray-600">{data.licenseNumber}</p>
            </div>
            <div>
              <span className="font-medium">Issuing Body:</span>
              <p className="text-gray-600">{data.licenseIssuingBody}</p>
            </div>
            <div>
              <span className="font-medium">Experience:</span>
              <p className="text-gray-600">{data.yearsOfExperience} years</p>
            </div>
            <div>
              <span className="font-medium">Qualifications:</span>
              <p className="text-gray-600">{data.qualifications}</p>
            </div>
            <div>
              <span className="font-medium">Languages:</span>
              <p className="text-gray-600">{data.languages.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        {data.servicesOffered && data.servicesOffered.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Services Offered ({data.servicesOffered.length})
            </h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {data.servicesOffered.map((serviceId) => (
                <li key={serviceId}>• {getServiceName(serviceId)}</li>
              ))}
            </ul>
            {data.consultationFee && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium">Consultation Fee:</span>
                <span className="text-gray-600 ml-2">ZMW {data.consultationFee.toFixed(2)}</span>
              </div>
            )}
            {data.serviceHours && (
              <div className="mt-2">
                <span className="font-medium">Service Hours:</span>
                <span className="text-gray-600 ml-2">{data.serviceHours}</span>
              </div>
            )}
          </div>
        )}

        {/* Biography */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Professional Biography</h3>
          <p className="text-sm text-gray-600">{data.biography}</p>
        </div>

        {/* Agreements */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              ⚠️ Important Information
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Your registration will be reviewed by hospital administration</li>
              <li>• Verification process may take 2-3 business days</li>
              <li>• You will receive an email once your account is approved</li>
              <li>• All credentials will be verified against official records</li>
            </ul>
          </div>

          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and 
                understand that my account is subject to hospital policies and medical regulations.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I acknowledge that I have read and agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> 
                regarding the handling of my personal and professional information.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreedToVerification}
                onChange={(e) => setAgreedToVerification(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I certify that all information provided is accurate and truthful. I understand that 
                providing false information may result in immediate rejection and potential legal consequences.
              </span>
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Registration Error</h4>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Registration...
              </>
            ) : (
              'Submit Registration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmationStep;
