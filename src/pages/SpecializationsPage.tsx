import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  HeartPulse,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const SpecializationsPage: React.FC = () => {
  const departments = [
    {
      name: 'Cardiology',
      icon: '❤️',
      tagline: 'Heart, Vascular Health & Hypertension Management',
      commonSymptoms: ['Chest tightness or pain', 'Shortness of breath', 'Heart palpitations', 'High blood pressure'],
      procedures: ['ECG', 'Echocardiography', 'TMT Stress Test', 'Angiography', 'Holter Monitoring'],
      doctorCount: '18+ Doctors',
    },
    {
      name: 'Dermatology',
      icon: '✨',
      tagline: 'Skin, Hair, Nail & Aesthetic Clinical Care',
      commonSymptoms: ['Severe acne & rosacea', 'Skin rashes & eczema', 'Unexplained hair fall', 'Pigmentation & moles'],
      procedures: ['Skin Biopsy', 'Laser Therapy', 'Chemical Peels', 'Allergy Patch Testing', 'PRP Hair Therapy'],
      doctorCount: '14+ Doctors',
    },
    {
      name: 'Neurology',
      icon: '🧠',
      tagline: 'Brain, Spine & Peripheral Nerve Disorders',
      commonSymptoms: ['Chronic migraines & headaches', 'Dizziness & vertigo', 'Numbness or tremors', 'Seizures & memory loss'],
      procedures: ['EEG', 'EMG / Nerve Conduction', 'Brain MRI/CT', 'Stroke Management', 'Sleep Study'],
      doctorCount: '12+ Doctors',
    },
    {
      name: 'Orthopedics',
      icon: '🦴',
      tagline: 'Bones, Joints, Ligaments & Trauma Surgery',
      commonSymptoms: ['Knee & hip joint stiffness', 'Chronic lower back pain', 'Sports injury / ligament tear', 'Fractures'],
      procedures: ['Joint Replacement', 'Arthroscopy', 'Spine Rehabilitation', 'Fracture Casting', 'Physiotherapy'],
      doctorCount: '20+ Doctors',
    },
    {
      name: 'Pediatrics',
      icon: '👶',
      tagline: 'Infant, Child Care, Growth & Immunizations',
      commonSymptoms: ['Childhood fever & infections', 'Growth & development delays', 'Cough & wheezing', 'Digestive issues'],
      procedures: ['Universal Immunizations', 'Newborn Screening', 'Pediatric ICU (PICU)', 'Nutritional Counseling'],
      doctorCount: '15+ Doctors',
    },
    {
      name: 'Gynecology',
      icon: '🌸',
      tagline: "Women's Health, Obstetrics & Maternity",
      commonSymptoms: ['Irregular periods / PCOS', 'Pregnancy & prenatal checkups', 'Pelvic pain', 'Hormonal imbalance'],
      procedures: ['Pelvic Ultrasound', 'Pap Smear Screening', 'Antenatal Care', 'Laparoscopy', 'Fertility Workup'],
      doctorCount: '16+ Doctors',
    },
    {
      name: 'ENT',
      icon: '👂',
      tagline: 'Ear, Nose, Sinus, Throat & Hearing Care',
      commonSymptoms: ['Hearing loss & tinnitus', 'Chronic sinusitis', 'Tonsillitis & sore throat', 'Snoring & sleep apnea'],
      procedures: ['Audiometry Hearing Test', 'Nasal Endoscopy', 'Tonsillectomy', 'Septoplasty', 'Microscopic Ear Surgery'],
      doctorCount: '11+ Doctors',
    },
    {
      name: 'Dentistry',
      icon: '🦷',
      tagline: 'Oral Surgery, Root Canal & Aesthetic Smile Design',
      commonSymptoms: ['Toothache & cavity pain', 'Bleeding gums', 'Wisdom tooth impaction', 'Crooked or stained teeth'],
      procedures: ['Root Canal Treatment (RCT)', 'Dental Implants', 'Teeth Whitening', 'Orthodontic Braces/Aligners', 'Crowns'],
      doctorCount: '19+ Doctors',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
            Medical Departments
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Comprehensive Clinical Specializations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            MediCare hosts over 10+ clinical departments equipped with certified doctors and state-of-the-art diagnostic technology.
          </p>
        </div>

        {/* Specializations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{dept.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{dept.name}</h3>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{dept.tagline}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {dept.doctorCount}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    When to Consult (Symptoms):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {dept.commonSymptoms.map((sym, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{sym}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Procedures & Diagnostics:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.procedures.map((proc, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        {proc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <Link
                  to={`/doctors?specialization=${encodeURIComponent(dept.name)}`}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
                >
                  <span>Book {dept.name} Specialist Doctor</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
