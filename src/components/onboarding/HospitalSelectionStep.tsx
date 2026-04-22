import React, { useState } from "react";
import { Building2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

interface DoctorData {
  hospitalId: string;
  department?: string;
  ward?: string;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: string;
}

interface HospitalSelectionStepProps {
  data: DoctorData;
  updateData: (updates: Partial<DoctorData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const HospitalSelectionStep: React.FC<HospitalSelectionStepProps> = ({
  data,
  updateData,
  onNext,
  onPrev,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-defined hospitals (no need to fetch from Firestore)
  const hospitals: Hospital[] = [
    {
      id: "maina_soko",
      name: "Maina Soko Medical Centre",
      address: "Lusaka, Zambia",
      phone: "+260-211-123456",
      email: "info@mainasko.zm",
      status: "ACTIVE",
    },
    {
      id: "uth",
      name: "University Teaching Hospital",
      address: "Lusaka, Zambia",
      phone: "+260-211-789012",
      email: "info@uth.zm",
      status: "ACTIVE",
    },
    {
      id: "chilenje",
      name: "Chilenje Level 1 Hospital",
      address: "Lusaka, Zambia",
      phone: "+260-211-345678",
      email: "info@chilenje.zm",
      status: "ACTIVE",
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.hospitalId) {
      newErrors.hospitalId = "Please select a hospital";
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
  const selectedHospital = hospitals.find(
    (hospital) => hospital.id === data.hospitalId,
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          <Building2 className="h-3.5 w-3.5" />
          Facility Matching
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Hospital Selection</h2>
        <p className="max-w-2xl text-sm leading-6 text-gray-600">
          Select the hospital where you practice so your account is routed to
          the right verification team and patients see the correct clinical
          affiliation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Hospital *
          </label>
          <div className="grid gap-4">
            {hospitals.map((hospital) => (
              <label
                key={hospital.id}
                className={`block cursor-pointer rounded-3xl border p-5 transition-all ${
                  data.hospitalId === hospital.id
                    ? "border-teal-500 bg-teal-50 shadow-[0_20px_40px_rgba(13,148,136,0.12)]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    id={`hospital-${hospital.id}`}
                    name="hospital"
                    value={hospital.id}
                    checked={data.hospitalId === hospital.id}
                    onChange={(e) => updateData({ hospitalId: e.target.value })}
                    className="mt-1 h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {hospital.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Facility onboarding and verification contact
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          data.hospitalId === hospital.id
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {data.hospitalId === hospital.id
                          ? "Selected"
                          : hospital.status}
                      </span>
                    </div>
                    <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-700" />
                        {hospital.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-700" />
                        {hospital.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-700" />
                        {hospital.email}
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.hospitalId && (
            <p className="mt-2 text-sm text-red-600">{errors.hospitalId}</p>
          )}
        </div>

        {selectedHospital && (
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-700" />
              <div>
                <h4 className="font-semibold text-slate-900">
                  Selected facility verification
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {selectedHospital.name} will verify your identity,
                  credentials, and departmental alignment before clinician
                  access is activated.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Department (Optional)
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={data.department || ""}
              onChange={(e) => updateData({ department: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Cardiology, Emergency, OPD"
            />
          </div>

          <div>
            <label
              htmlFor="ward"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ward/Unit (Optional)
            </label>
            <input
              type="text"
              id="ward"
              name="ward"
              value={data.ward || ""}
              onChange={(e) => updateData({ ward: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Ward A, ICU, Theatre"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="mb-2 font-semibold text-slate-900">
            Hospital Verification Process
          </h4>
          <p className="text-sm leading-6 text-slate-700">
            After registration, your credentials will be verified by the
            hospital administration. You will receive an email once your account
            is approved and ready for clinical use.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Previous
          </button>
          <button
            type="submit"
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Continue to Specialization
          </button>
        </div>
      </form>
    </div>
  );
};

export default HospitalSelectionStep;
