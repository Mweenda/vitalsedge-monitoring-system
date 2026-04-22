import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { auth, createDoctorProfile, initializeHospitals } from "../firebase";
import DoctorRegisterStep from "../components/onboarding/DoctorRegisterStep";
import HospitalSelectionStep from "../components/onboarding/HospitalSelectionStep";
import SpecializationStep from "../components/onboarding/SpecializationStep";
import ServicesStep from "../components/onboarding/ServicesStep";
import ProfessionalInfoStep from "../components/onboarding/ProfessionalInfoStep";
import ConfirmationStep from "../components/onboarding/ConfirmationStep";

interface DoctorData {
  email: string;
  password: string;
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
  availabilityStatus: "AVAILABLE" | "ON_LEAVE" | "PART_TIME";
}

const DoctorOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [doctorData, setDoctorData] = useState<DoctorData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    hospitalId: "",
    department: "",
    ward: "",
    specialization: "",
    licenseNumber: "",
    licenseIssuingBody: "",
    yearsOfExperience: 0,
    qualifications: "",
    servicesOffered: [],
    consultationFee: undefined,
    serviceHours: "",
    biography: "",
    profileImageUrl: "",
    languages: [],
    availabilityStatus: "AVAILABLE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const steps = [
    { id: 1, label: "Account", detail: "Identity and sign-in details" },
    { id: 2, label: "Hospital", detail: "Clinical facility alignment" },
    { id: 3, label: "Credentials", detail: "Specialty and license data" },
    { id: 4, label: "Services", detail: "Scope of care offered" },
    { id: 5, label: "Profile", detail: "Visibility and availability" },
    { id: 6, label: "Confirm", detail: "Review before submission" },
  ];

  const updateDoctorData = (updates: Partial<DoctorData>) => {
    setDoctorData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Initialize hospitals if not already done
      await initializeHospitals();

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        doctorData.email,
        doctorData.password,
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${doctorData.firstName} ${doctorData.lastName}`,
      });

      // Create doctor profile in Firestore
      await createDoctorProfile({
        uid: user.uid,
        email: user.email!,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        phone: doctorData.phone,
        hospitalId: doctorData.hospitalId,
        department: doctorData.department,
        ward: doctorData.ward,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        licenseIssuingBody: doctorData.licenseIssuingBody,
        yearsOfExperience: doctorData.yearsOfExperience,
        qualifications: doctorData.qualifications,
        servicesOffered: doctorData.servicesOffered,
        consultationFee: doctorData.consultationFee,
        serviceHours: doctorData.serviceHours,
        biography: doctorData.biography,
        profileImageUrl: doctorData.profileImageUrl,
        languages: doctorData.languages,
        availabilityStatus: doctorData.availabilityStatus,
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DoctorRegisterStep
            data={doctorData}
            updateData={updateDoctorData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <HospitalSelectionStep
            data={doctorData}
            updateData={updateDoctorData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <SpecializationStep
            data={doctorData}
            updateData={updateDoctorData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <ServicesStep
            data={doctorData}
            updateData={updateDoctorData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <ProfessionalInfoStep
            data={doctorData}
            updateData={updateDoctorData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <ConfirmationStep
            data={doctorData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  const completionPercentage = Math.round(
    ((currentStep - 1) / (steps.length - 1)) * 100,
  );
  const selectedHospital =
    doctorData.hospitalId === "maina_soko"
      ? "Maina Soko Medical Centre"
      : doctorData.hospitalId === "uth"
        ? "University Teaching Hospital"
        : doctorData.hospitalId === "chilenje"
          ? "Chilenje Level 1 Hospital"
          : "Not selected yet";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(30,64,175,0.12),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_45%,_#e2e8f0_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:border-slate-400 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-300">
                Doctor Onboarding
              </p>
              <h1 className="font-serif text-4xl leading-tight text-white">
                Build a trusted clinical profile patients can rely on.
              </h1>
              <p className="text-sm leading-6 text-slate-300">
                This flow prepares your account for hospital verification,
                clinician discovery, and secure access to the monitoring
                platform.
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Progress
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {completionPercentage}%
                  </p>
                </div>
                <p className="text-sm text-slate-400">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 transition-all duration-300"
                  style={{ width: `${Math.max(completionPercentage, 6)}%` }}
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-teal-300/70 bg-teal-400/10"
                        : isComplete
                          ? "border-white/10 bg-white/5"
                          : "border-transparent bg-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-teal-300 text-slate-950"
                            : isComplete
                              ? "bg-white text-slate-950"
                              : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {isComplete ? (
                          <BadgeCheck className="h-4 w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {step.label}
                        </p>
                        <p className="text-xs leading-5 text-slate-400">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-teal-300" />
                <div>
                  <p className="font-medium text-white">Hospital</p>
                  <p>{selectedHospital}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 text-teal-300" />
                <div>
                  <p className="font-medium text-white">Specialization</p>
                  <p>
                    {doctorData.specialization || "Pending credential details"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-teal-300" />
                <div>
                  <p className="font-medium text-white">Verification</p>
                  <p>Credentials are reviewed before account activation.</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                  Clinical Access Setup
                </p>
                <h2 className="text-2xl font-semibold text-slate-950">
                  {steps[currentStep - 1].label}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Complete each section carefully. The information you enter
                  here is used for hospital verification, clinician search, and
                  profile readiness.
                </p>
              </div>
              {error && (
                <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>

            <div
              className={
                loading ? "pointer-events-none opacity-70 transition" : ""
              }
            >
              {renderStep()}
            </div>

            {loading && (
              <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Submitting registration and creating your clinician profile.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;
