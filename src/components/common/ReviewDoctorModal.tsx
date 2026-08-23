import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../../services/api.ts';
import { IAppointment } from '../../types.ts';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface ReviewDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: IAppointment;
  onReviewed?: () => void;
}

export const ReviewDoctorModal: React.FC<ReviewDoctorModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onReviewed,
}) => {
  const { showToast } = useNotifications();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.submitReview({
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        comment: comment.trim(),
      });

      if (res.success) {
        showToast('Review Submitted', 'Thank you for your valuable feedback!', 'success');
        if (onReviewed) onReviewed();
        onClose();
      } else {
        setError(res.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Rate & Review Consultation</h3>
          </div>
          <button
            id="review-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Doctor Brief */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <img
              src={appointment.doctorProfileImage}
              alt={appointment.doctorName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{appointment.doctorName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{appointment.doctorSpecialization} • {appointment.hospitalName}</p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Consulted on {appointment.appointmentDate}</p>
            </div>
          </div>

          {/* Star Selector */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Rating Experience
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {rating === 5 ? 'Excellent & Highly Professional (5/5)' :
               rating === 4 ? 'Very Good Experience (4/5)' :
               rating === 3 ? 'Average Consultation (3/5)' :
               rating === 2 ? 'Needs Improvement (2/5)' : 'Poor Experience (1/5)'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Share your clinical experience & advice for other patients: *
            </label>
            <textarea
              id="review-comment-textarea"
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Dr. Sharma was very attentive, explained the diagnostic reports thoroughly, and provided a clear recovery routine. Clinic wait time was minimal..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="submit-review-btn"
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Verified Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
