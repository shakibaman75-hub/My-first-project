import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bot,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  HelpCircle,
  Clock,
  User
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { IDoctor } from '../../types.ts';
import { Link } from 'react-router-dom';

interface AISymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor?: (doctor: IDoctor) => void;
}

export const AISymptomModal: React.FC<AISymptomModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('Male');
  const [duration, setDuration] = useState('2-3 days');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.checkSymptoms({
        symptoms,
        age,
        gender,
        duration,
      });

      if (res.success) {
        setResult(res);
      } else {
        setError('Failed to analyze symptoms. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with medical AI triage service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bot className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg tracking-tight">MediCare AI Health Assistant</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-blue-100 border border-white/20">
                  Gemini Medical Triage
                </span>
              </div>
              <p className="text-xs text-blue-100/80">Preliminary symptom analysis & smart specialist doctor recommendation</p>
            </div>
          </div>
          <button
            id="ai-symptom-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Clinical Notice:</strong> This AI triage tool provides preliminary educational guidance only. If you are experiencing sudden chest pain, severe breathlessness, or trauma, immediately call 108 emergency.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Describe what you are experiencing in detail: *
                </label>
                <textarea
                  id="ai-symptoms-textarea"
                  rows={4}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild chest tightness and elevated heart rate after brisk jogging, accompanied by slight dizziness for the past 2 days..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    id="ai-age-input"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    id="ai-gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    id="ai-duration-select"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="A few hours">A few hours</option>
                    <option value="2-3 days">2-3 days</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="Over a month">Over a month</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-500 font-semibold">{error}</p>
              )}

              <button
                id="ai-analyze-submit-btn"
                type="submit"
                disabled={isLoading || !symptoms.trim()}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Clinical Symptoms...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Assess Symptoms & Recommend Specialist</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Assessment Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4" /> Recommended Department:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    result.assessment.urgency === 'Emergency'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : result.assessment.urgency === 'Priority'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {result.assessment.urgency} Care
                  </span>
                </div>

                <p className="text-base font-bold text-blue-950 dark:text-blue-100">
                  {result.assessment.recommendedDepartment}
                </p>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.assessment.assessmentSummary}
                </p>

                {result.assessment.questionsForDoctor && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-900">
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Helpful Questions to Ask Your Doctor:
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                      {result.assessment.questionsForDoctor.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Top Doctors */}
              {result.recommendedDoctors && result.recommendedDoctors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Available {result.assessment.recommendedDepartment} Specialists:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.recommendedDoctors.map((doc: IDoctor) => (
                      <div
                        key={doc._id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={doc.profileImage}
                            alt={doc.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{doc.hospitalName}</p>
                            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">₹{doc.consultationFee}</p>
                          </div>
                        </div>
                        <Link
                          to={`/doctors/${doc._id}`}
                          onClick={onClose}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex-shrink-0"
                        >
                          Book
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ← Check Another Symptom
                </button>
                <Link
                  to={`/doctors?specialization=${encodeURIComponent(result.assessment.recommendedDepartment)}`}
                  onClick={onClose}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All {result.assessment.recommendedDepartment} Doctors <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
