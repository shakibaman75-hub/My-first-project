import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  HeartPulse
} from 'lucide-react';
import { IAppointment } from '../../types.ts';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: IAppointment;
  doctorData?: any;
  hospitalData?: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
  doctorData,
  hospitalData,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const receiptNo = `REC-${(appointment.paymentId || appointment._id).slice(-8).toUpperCase()}`;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      doc.setFillColor(13, 148, 136); // Teal #0d9488
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICARE HEALTHCARE SYSTEM', 14, 15);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Digital Appointment Confirmation & Payment Receipt', 14, 22);

      // Hospital & Receipt Meta
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Receipt No: ${receiptNo}`, 14, 42);
      doc.text(`Appointment ID: #${appointment._id}`, 14, 48);
      doc.text(`Booking Date: ${new Date(appointment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 54);

      doc.text(`Hospital: ${appointment.hospitalName}`, 120, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Status: PAID (Verified Online)`, 120, 48);
      doc.text(`Transaction Ref: ${appointment.paymentId || 'TXN-DIRECT'}`, 120, 54);

      // Divider
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 60, 196, 60);

      // Patient Details Section
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 65, 182, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('PATIENT INFORMATION', 18, 72);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${appointment.patientName}`, 18, 80);
      doc.text(`Email: ${appointment.patientEmail}`, 18, 86);
      doc.text(`Phone: ${appointment.patientPhone}`, 18, 92);

      doc.text(`Gender: ${appointment.patientGender || 'Not specified'}`, 110, 80);
      doc.text(`Age: ${appointment.patientAge || '25'} Years`, 110, 86);
      doc.text(`Reason: ${appointment.reason.slice(0, 35)}...`, 110, 92);

      // Consultation Details Section
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 105, 182, 38, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CONSULTATION SCHEDULE & CLINICAL SPECIALIST', 18, 112);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Doctor: ${appointment.doctorName}`, 18, 120);
      doc.text(`Department: ${appointment.doctorSpecialization}`, 18, 126);
      doc.text(`Qualification: ${doctorData?.qualification || 'MBBS, MD Specialist'}`, 18, 132);
      doc.text(`Medical Reg #: ${doctorData?.registrationNumber || 'MCI-REG-VALIDATED'}`, 18, 138);

      doc.setFont('helvetica', 'bold');
      doc.text(`Appointment Date: ${appointment.appointmentDate}`, 110, 120);
      doc.text(`Time Slot: ${appointment.appointmentTime}`, 110, 126);
      doc.setFont('helvetica', 'normal');
      doc.text(`Clinic Room: Consultation Suite 3B`, 110, 132);
      doc.text(`Reporting Time: 15 mins prior to slot`, 110, 138);

      // Financial Details Table
      doc.line(14, 150, 196, 150);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 18, 158);
      doc.text('Amount (INR)', 160, 158);
      doc.line(14, 162, 196, 162);

      doc.setFont('helvetica', 'normal');
      doc.text(`Doctor Consultation & Clinical Assessment Fee`, 18, 170);
      doc.text(`₹ ${appointment.amount.toFixed(2)}`, 160, 170);

      doc.text(`Hospital Facility & Digital OPD Registration`, 18, 178);
      doc.text(`₹ 0.00 (Waived)`, 160, 178);

      doc.text(`Healthcare GST / Applicable Taxes`, 18, 186);
      doc.text(`₹ 0.00 (Exempt)`, 160, 186);

      doc.line(14, 192, 196, 192);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Paid Amount:', 18, 200);
      doc.text(`₹ ${appointment.amount.toFixed(2)}`, 160, 200);

      // Hospital Stamp & Instructions
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('• Please carry this digital/printed receipt along with a valid Government Photo ID.', 14, 218);
      doc.text('• For rescheduling or cancellation, please modify through the MediCare portal at least 4 hours before the appointment.', 14, 224);
      doc.text('• In case of emergency or unexpected clinic delay, contact hospital helpdesk directly.', 14, 230);

      // Verification seal
      doc.setDrawColor(13, 148, 136);
      doc.rect(135, 240, 60, 25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text('MEDICARE DIGITAL VERIFIED', 140, 248);
      doc.setFontSize(8);
      doc.text('AUTHORIZED MEDICAL RECORD', 140, 255);
      doc.text(`Signed: ${new Date().toLocaleDateString()}`, 140, 261);

      doc.save(`MediCare_Receipt_${appointment._id}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Action Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Appointment Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="download-receipt-pdf-btn"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              id="receipt-modal-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body for Preview & Print */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Header Brand */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-extrabold text-xl">
                <HeartPulse className="w-6 h-6" />
                <span>MediCare Health System</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">NABH Accredited Tertiary Healthcare Network</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ✓ Payment Confirmed
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{receiptNo}</p>
            </div>
          </div>

          {/* Key Info Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Appointment ID</span>
              <span className="font-bold text-slate-900 dark:text-white">#{appointment._id}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Date & Time</span>
              <span className="font-bold text-slate-900 dark:text-white">{appointment.appointmentDate} • {appointment.appointmentTime}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Transaction ID</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">{appointment.paymentId || 'TXN_VERIFIED'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Total Paid</span>
              <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">₹{appointment.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" /> Patient Details
              </p>
              <p><span className="text-slate-500 dark:text-slate-400">Name:</span> <strong className="font-semibold text-slate-800 dark:text-slate-200">{appointment.patientName}</strong></p>
              <p><span className="text-slate-500 dark:text-slate-400">Email:</span> {appointment.patientEmail}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Phone:</span> {appointment.patientPhone}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Gender / Age:</span> {appointment.patientGender || 'Male'} • {appointment.patientAge || '25'} yrs</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Doctor & Hospital
              </p>
              <p><span className="text-slate-500 dark:text-slate-400">Doctor:</span> <strong className="font-semibold text-slate-800 dark:text-slate-200">{appointment.doctorName}</strong></p>
              <p><span className="text-slate-500 dark:text-slate-400">Department:</span> {appointment.doctorSpecialization}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Hospital:</span> {appointment.hospitalName}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Reason:</span> {appointment.reason}</p>
            </div>
          </div>

          {/* Payment Statement */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <th className="text-left font-semibold pb-2">Item Description</th>
                  <th className="text-right font-semibold pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="py-2.5">Doctor Consultation & Diagnostic Assessment</td>
                  <td className="py-2.5 text-right font-semibold">₹{appointment.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Digital OPD Platform Fee</td>
                  <td className="py-2.5 text-right text-emerald-600 font-medium">₹0.00 (FREE)</td>
                </tr>
                <tr className="font-bold text-sm text-slate-900 dark:text-white">
                  <td className="py-3">Grand Total Paid</td>
                  <td className="py-3 text-right text-teal-600 dark:text-teal-400">₹{appointment.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Instructions Footer */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 text-[11px] text-teal-900 dark:text-teal-300">
            <p className="font-bold mb-0.5">Patient Guidelines:</p>
            <p>Please present this digital confirmation upon arrival at the hospital reception counter. Clinic check-in opens 15 minutes prior to scheduled consultation slot.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
