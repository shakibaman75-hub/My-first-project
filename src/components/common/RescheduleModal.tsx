import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { IAppointment } from '../../types.ts';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: IAppointment;
  onRescheduled?: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRescheduled,
}) => {
  const { showToast } = useNotifications();
  const [selectedDate, setSelectedDate] = useState(() => {
    const nextDay = new Date(Date.now() + 86400000 * 2);
    return nextDay.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<{ time: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setError(null);
      try {
        const res = await api.getDoctorSlots(appointment.doctorId, selectedDate);
        if (res.success && res.available) {
          setAvailableSlots(res.slots);
          const firstAvailable = res.slots.find((s) => s.isAvailable);
          setSelectedSlot(firstAvailable ? firstAvailable.time : '');
        } else {
          setAvailableSlots([]);
          setSelectedSlot('');
          setError(res.reason || 'Doctor is not available on this date.');
        }
      } catch (err: any) {
        setError('Failed to fetch available slots for this date.');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, selectedDate, appointment.doctorId]);

  if (!isOpen) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.rescheduleAppointment(appointment._id, selectedDate, selectedSlot);
      if (res.success) {
        showToast('Appointment Rescheduled', `Updated to ${selectedDate} at ${selectedSlot}`, 'success');
        if (onRescheduled) onRescheduled();
        onClose();
      } else {
        setError(res.message || 'Rescheduling failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while rescheduling.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Reschedule Appointment</h3>
          </div>
          <button
            id="reschedule-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">{appointment.doctorName}</p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Currently booked: {appointment.appointmentDate} at {appointment.appointmentTime}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Choose New Appointment Date:
            </label>
            <input
              id="reschedule-date-input"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Available Time Slots:
            </label>
            {isLoadingSlots ? (
              <div className="py-6 text-center text-xs text-slate-500">Checking doctor availability...</div>
            ) : availableSlots.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900">
                {error || 'No open slots on this date. Please pick another day.'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      !slot.isAvailable
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        : selectedSlot === slot.time
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && availableSlots.length > 0 && (
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="confirm-reschedule-btn"
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
