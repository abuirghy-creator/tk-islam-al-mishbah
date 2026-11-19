import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SppInvoice } from '../../types';
import {
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
  ShieldCheck,
  X,
  FileCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportSppReceiptPDF } from '../../services/pdfService';

export const SppPayment: React.FC = () => {
  const { sppInvoices, students, currentUser, paySppInvoice, verifySppInvoice, canEditSchoolData } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SppInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<SppInvoice['paymentMethod']>('QRIS');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // If user is parent, filter to their child's bills
  const isParent = currentUser.role === 'ortu';
  const myStudent = isParent && currentUser.relatedStudentId
    ? students.find((s) => s.id === currentUser.relatedStudentId) || students[0]
    : null;

  const userInvoices = isParent && myStudent
    ? sppInvoices.filter((inv) => inv.studentId === myStudent.id)
    : sppInvoices;

  const filteredInvoices = userInvoices.filter((inv) => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const handleOpenPay = (inv: SppInvoice) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
    setPaymentSuccess(false);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    paySppInvoice(selectedInvoice.id, paymentMethod);
    setPaymentSuccess(true);
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setIsPayModalOpen(false);
      setPaymentSuccess(false);
    }, 1200);
  };

  const handleDownloadReceipt = (inv: SppInvoice) => {
    const student = students.find((s) => s.id === inv.studentId) || students[0];
    exportSppReceiptPDF(inv, student);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <CreditCard className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Layanan Keuangan Digital Sekolah
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Pembayaran SPP Online & Administrasi Santri
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Kemudahan transaksi pembayaran SPP, uang kegiatan, dan catering melalui QRIS instan, Bank Syariah Indonesia (BSI), BCA, dan e-Wallet dengan kuitansi otomatis.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-xs">
          <span className="text-emerald-200 block font-medium">BSI Virtual Account Sekolah:</span>
          <span className="font-mono font-bold text-amber-300 text-sm">451-8899-TKALMISHBAH</span>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tagihan ({userInvoices.length})
            </button>
            <button
              onClick={() => setFilterStatus('BELUM DIBAYAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'BELUM DIBAYAR'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Bayar
            </button>
            <button
              onClick={() => setFilterStatus('LUNAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'LUNAS'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lunas
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {isParent ? `Tagihan Ananda: ${myStudent?.name}` : 'Seluruh Tagihan Siswa'}
          </span>
        </div>

        {/* Invoice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((inv) => {
            const student = students.find((s) => s.id === inv.studentId);
            const isPaid = inv.status === 'LUNAS';

            return (
              <div
                key={inv.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isPaid
                    ? 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200'
                    : 'bg-white border-slate-200 shadow-xs hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-slate-400">{inv.id}</span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'MENUNGGU VERIFIKASI'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {inv.category}
                  </h4>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                    Periode: {inv.monthYear}
                  </div>

                  {/* Student info */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                    <img
                      src={student?.photoUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold text-slate-800 truncate">{inv.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.className} • NIS: {inv.studentId}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total Nominal:</span>
                    <span className="text-lg font-black text-slate-900">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {isPaid ? (
                    <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                      <div>Dibayar via: {inv.paymentMethod}</div>
                      <div>Tgl: {inv.paidDate}</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-rose-600">
                      Jatuh tempo: {inv.dueDate}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  {isPaid ? (
                    <button
                      onClick={() => handleDownloadReceipt(inv)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Kuitansi PDF
                    </button>
                  ) : canEditSchoolData ? (
                    <>
                      <button
                        onClick={() => handleOpenPay(inv)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Bayar Sekarang
                      </button>
                      <button
                        onClick={() => verifySppInvoice(inv.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl cursor-pointer"
                        title="Verifikasi Pembayaran (Pemilik Akun)"
                      >
                        <FileCheck className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full py-2 px-3 bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-[11px] rounded-xl text-center">
                      Hanya Lihat (Verifikasi oleh Pemilik Akun)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ONLINE PAYMENT MODAL */}
      {isPayModalOpen && selectedInvoice && canEditSchoolData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                  Pembayaran Online SPP Santri
                </h3>
                <p className="text-xs text-emerald-100">
                  {selectedInvoice.category} - {selectedInvoice.monthYear}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Payment Summary */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                    Santri: {selectedInvoice.studentName}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Nominal Tagihan
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-950 font-mono">
                  Rp {selectedInvoice.amount.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Pilih Saluran Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'QRIS', label: 'QRIS (Semua Bank & e-Wallet)', icon: QrCode },
                    { id: 'Transfer BSI', label: 'BSI (Bank Syariah Indonesia)', icon: Building2 },
                    { id: 'Transfer BCA', label: 'BCA Virtual Account', icon: Building2 },
                    { id: 'GoPay / e-Wallet', label: 'GoPay / OVO / Dana', icon: Wallet }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <m.icon className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic QRIS or Virtual Account Box */}
              {paymentMethod === 'QRIS' ? (
                <div className="p-4 bg-slate-900 rounded-2xl text-white text-center space-y-2">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                    QRIS Standar Pembayaran Nasional
                  </span>
                  {/* Dynamic simulated QR code */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Buka BCA Mobile, Livin, BSI Mobile, GoPay, atau Dana lalu scan kode di atas
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-slate-700">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Nomor Virtual Account:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                      8899-0189-234101
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Atas Nama:</span>
                    <span className="font-semibold text-slate-800">
                      TK ISLAM AL MISHBAH ({selectedInvoice.studentName})
                    </span>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={handleConfirmPayment}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Saya Sudah Membayar (Verifikasi & Cetak Kuitansi)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
