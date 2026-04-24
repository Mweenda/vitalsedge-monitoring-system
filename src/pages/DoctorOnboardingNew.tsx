import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { auth, createDoctorProfile, initializeHospitals } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
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
  const [mounted, setMounted] = useState(false);
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
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    { id: 1, label: "Account", detail: "Identity and credentials" },
    { id: 2, label: "Hospital", detail: "Facility alignment" },
    { id: 3, label: "Credentials", detail: "License and specialty" },
    { id: 4, label: "Services", detail: "Scope of care" },
    { id: 5, label: "Profile", detail: "Visibility settings" },
    { id: 6, label: "Confirm", detail: "Review and submit" },
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
      await initializeHospitals();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        doctorData.email,
        doctorData.password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${doctorData.firstName} ${doctorData.lastName}`,
      });

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
          <DoctorRegisterStep data={doctorData} updateData={updateDoctorData} onNext={nextStep} />
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

  const completionPercentage = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);
  const selectedHospital =
    doctorData.hospitalId === "maina_soko"
      ? "Maina Soko Medical Centre"
      : doctorData.hospitalId === "uth"
        ? "University Teaching Hospital"
        : doctorData.hospitalId === "chilenje"
          ? "Chilenje Level 1 Hospital"
          : "Select a hospital";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative">
        {/* Top Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -20 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 blur-lg opacity-50" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <Stethoscope className="h-5 w-5 text-slate-950" />
                </div>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                VitalsEdge
              </span>
            </div>
            <div className="w-32" />
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-12">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -20 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 backdrop-blur-xl">
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    Clinician Registration
                  </span>
                </div>
                <h1 className="font-serif text-2xl leading-tight text-white">
                  Build your trusted clinical profile
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Complete your profile for hospital verification and patient access.
                </p>
              </div>

              {/* Progress Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 backdrop-blur-xl">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Progress</p>
                    <motion.p
                      className="mt-2 text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {completionPercentage}%
                    </motion.p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Step {currentStep} of {steps.length}
                  </p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(completionPercentage, 6)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-2">
                {steps.map((step) => {
                  const isActive = step.id === currentStep;
                  const isComplete = step.id < currentStep;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: step.id * 0.05 }}
                      className={`rounded-xl border px-4 py-3 transition-all ${
                        isActive
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : isComplete
                            ? "border-white/10 bg-white/5"
                            : "border-transparent bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            isActive
                              ? "bg-emerald-500 text-slate-950"
                              : isComplete
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/10 text-gray-400"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{step.label}</p>
                          <p className="text-xs text-gray-500">{step.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Info Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-500">Hospital</p>
                      <p className="text-sm font-medium">{selectedHospital}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Stethoscope className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-500">Specialization</p>
                      <p className="text-sm font-medium">
                        {doctorData.specialization || "Pending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-500">Verification</p>
                      <p className="text-sm font-medium">Review pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Main Form Area */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 backdrop-blur-xl"
            >
              {/* Step Header */}
              <div className="mb-8 border-b border-white/10 pb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Step {currentStep}: {steps[currentStep - 1].label}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  {steps[currentStep - 1].detail}
                </h2>
              </div>

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden rounded-xl border border-red-500/30 bg-red-950/40 p-4"
                  >
                    <p className="text-sm text-red-100">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Content */}
              <div className={loading ? "pointer-events-none opacity-70" : ""}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                    <span className="text-sm text-emerald-300">
                      Creating your clinician profile...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;