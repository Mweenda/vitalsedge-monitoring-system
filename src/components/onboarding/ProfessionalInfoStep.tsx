import React, { useState } from 'react';

interface DoctorData {
  biography: string;
  profileImageUrl?: string;
  languages: string[];
  availabilityStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PART_TIME';
}

interface ProfessionalInfoStepProps {
  data: DoctorData;
  updateData: (updates: Partial<DoctorData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ProfessionalInfoStep: React.FC<ProfessionalInfoStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const languages = [
    'English',
    'French',
    'Portuguese',
    'Spanish',
    'Arabic',
    'Chinese',
    'Hindi',
    'Local Languages'
  ];

  const availabilityStatuses = [
    { value: 'AVAILABLE', label: 'Available', description: 'Currently accepting new patients' },
    { value: 'PART_TIME', label: 'Part Time', description: 'Limited availability' },
    { value: 'ON_LEAVE', label: 'On Leave', description: 'Currently unavailable' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.biography.trim()) {
      newErrors.biography = 'Biography is required';
    } else if (data.biography.length > 500) {
      newErrors.biography = 'Biography must be less than 500 characters';
    }

    if (!data.languages || data.languages.length === 0) {
      newErrors.languages = 'Please select at least one language';
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

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = data.languages || [];
    if (currentLanguages.includes(language)) {
      updateData({ 
        languages: currentLanguages.filter(lang => lang !== language) 
      });
    } else {
      updateData({ 
        languages: [...currentLanguages, language] 
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload to Firebase Storage
      // For now, we'll simulate with a URL
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({ profileImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Professional Information
        </h2>
        <p className="text-gray-600">
          Complete your professional profile and availability
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Picture (Optional)
          </label>
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {data.profileImageUrl ? (
                <img
                  src={data.profileImageUrl}
                  alt="Profile"
                  className="h-20 w-20 object-cover rounded-full"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span>Upload Photo</span>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div>
          <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-1">
            Professional Biography *
          </label>
          <textarea
            id="biography"
            name="biography"
            value={data.biography}
            onChange={(e) => updateData({ biography: e.target.value })}
            rows={4}
            maxLength={500}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.biography ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tell us about your medical background, expertise, and approach to patient care..."
          />
          <div className="flex justify-between mt-1">
            {errors.biography && (
              <p className="text-sm text-red-600">{errors.biography}</p>
            )}
            <p className="text-xs text-gray-500">
              {data.biography.length}/500 characters
            </p>
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Languages Spoken * (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {languages.map((language) => (
              <label
                key={language}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  data.languages?.includes(language)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  id={`language-${language.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  name="languages"
                  checked={data.languages?.includes(language) || false}
                  onChange={() => handleLanguageToggle(language)}
                  className="mr-2"
                />
                <span className="text-sm">{language}</span>
              </label>
            ))}
          </div>
          {errors.languages && (
            <p className="mt-2 text-sm text-red-600">{errors.languages}</p>
          )}
        </div>

        {/* Availability Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Availability Status *
          </label>
          <div className="space-y-3">
            {availabilityStatuses.map((status) => (
              <label
                key={status.value}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.availabilityStatus === status.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  id={`availability-${status.value.toLowerCase()}`}
                  name="availability"
                  value={status.value}
                  checked={data.availabilityStatus === status.value}
                  onChange={(e) => updateData({ availabilityStatus: e.target.value as any })}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {status.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {status.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Profile Completion Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">
            ✨ Profile Completion Tips
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• A professional photo helps build trust with patients</li>
            <li>• Your biography should highlight your expertise and approach</li>
            <li>• Include all languages you're comfortable speaking</li>
            <li>• Keep your availability status up to date</li>
          </ul>
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
            Review & Confirm
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalInfoStep;
