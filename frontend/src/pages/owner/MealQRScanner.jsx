import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const MealQRScanner = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();

  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan result state
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'duplicate', 'expired', 'invalid', 'error'
  const [statusMessage, setStatusMessage] = useState('');

  // Manual fallback search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedTenantForManual, setSelectedTenantForManual] = useState(null);
  const [manualMealType, setManualMealType] = useState('breakfast');
  const [manualNotes, setManualNotes] = useState('Manual fallback verification by manager');

  const scannerRef = useRef(null);

  // Beep sound generator using Web Audio API
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // AudioContext may be blocked before interaction
    }
  };

  // Start HTML5 Camera QR Scanner
  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Pause and handle code
          await handleScannedCode(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );

      setScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error('Camera startup error:', err);
      toast.error('Could not access camera. Please check permissions or use manual check-in below.');
      setScanning(false);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // cleanup ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Handle scanned token
  const handleScannedCode = async (decodedString) => {
    try {
      const res = await api.post('/qr/scan', {
        token: decodedString,
        buildingId: selectedBuildingId,
      });

      if (res.data.success) {
        playBeep(true);
        setScanStatus('success');
        setStatusMessage('Meal attendance recorded successfully.');
        setLastScanResult(res.data);
      }
    } catch (err) {
      playBeep(false);
      const data = err.response?.data;
      if (data?.code === 'ALREADY_USED') {
        setScanStatus('duplicate');
        setStatusMessage('This QR code has already been used.');
        setLastScanResult(data);
      } else if (data?.code === 'EXPIRED') {
        setScanStatus('expired');
        setStatusMessage('Invalid or expired QR code.');
        setLastScanResult(data);
      } else if (data?.code === 'WRONG_PG') {
        setScanStatus('invalid');
        setStatusMessage(data.message || 'QR code from another PG rejected.');
        setLastScanResult(data);
      } else {
        setScanStatus('error');
        setStatusMessage(data?.message || 'Invalid or unreadable QR code.');
        setLastScanResult(null);
      }
    }
  };

  // Manual fallback search
  const handleManualSearch = async (e) => {
    e?.preventDefault();
    if (!selectedBuildingId) return;
    setSearchLoading(true);
    try {
      const res = await api.get('/qr/search-tenants', {
        params: { buildingId: selectedBuildingId, query: searchQuery },
      });
      if (res.data.success) {
        setSearchResults(res.data.tenants || []);
        if (res.data.currentMeal) {
          setManualMealType(res.data.currentMeal);
        }
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const submitManualAttendance = async () => {
    if (!selectedTenantForManual) return;
    try {
      const res = await api.post('/qr/manual-attendance', {
        tenantId: selectedTenantForManual.tenant._id,
        buildingId: selectedBuildingId,
        mealType: manualMealType,
        notes: manualNotes,
      });

      if (res.data.success) {
        playBeep(true);
        toast.success(res.data.message);
        setManualModalOpen(false);
        setScanStatus('success');
        setStatusMessage('Manual meal attendance recorded successfully.');
        setLastScanResult(res.data);
        handleManualSearch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record manual attendance');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Scanner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Security One-Time QR Protocol</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-brand-600" />
            <span>Meal Attendance QR Scanner</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Point camera at the tenant's daily meal QR code. Validates single-use token, meal timing, and resident identity atomically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Sound'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Live Camera Video Stream */}
        <div className="bg-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
          {/* Target Scanning Window */}
          <div
            id="qr-reader"
            className="w-full max-w-[320px] rounded-2xl overflow-hidden border-2 border-dashed border-brand-500/50 bg-slate-900/50"
          />

          {!scanning && (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Camera Scanner Idle</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Click "Start Camera Scanner" to begin scanning resident meal QR codes directly through your phone or laptop camera.
              </p>
              <button
                onClick={startScanner}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/30 transition-all"
              >
                Activate Camera
              </button>
            </div>
          )}

          {scanning && (
            <p className="text-xs text-brand-300 font-semibold mt-4 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Camera Active - Hold QR code steadily inside the frame</span>
            </p>
          )}
        </div>

        {/* Right Column: Instant Scan Verification Card */}
        <div className="space-y-4">
          <div
            className={`rounded-3xl p-6 border shadow-sm transition-all ${
              scanStatus === 'success'
                ? 'bg-emerald-50/80 border-emerald-300'
                : scanStatus === 'duplicate'
                ? 'bg-amber-50/80 border-amber-300'
                : scanStatus === 'expired' || scanStatus === 'invalid' || scanStatus === 'error'
                ? 'bg-rose-50/80 border-rose-300'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {scanStatus === 'success' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              ) : scanStatus === 'duplicate' ? (
                <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              ) : scanStatus ? (
                <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
              ) : (
                <QrCode className="w-7 h-7 text-slate-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {statusMessage || 'Waiting for QR Code Scan'}
                </h3>
                <p className="text-xs text-slate-500">
                  {scanStatus ? 'Scan verification result' : 'Scan a code to see resident verification'}
                </p>
              </div>
            </div>

            {/* Tenant details display on scan */}
            {lastScanResult?.tenant && (
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/60 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={lastScanResult.tenant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={lastScanResult.tenant.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-200"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {lastScanResult.tenant.name}
                    </h4>
                    <p className="text-xs font-semibold text-slate-600">
                      Room {lastScanResult.tenant.roomNumber} • {lastScanResult.tenant.bedNumber}
                    </p>
                    <p className="text-[11px] text-slate-400">{lastScanResult.tenant.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Meal Session
                    </span>
                    <span className="font-bold text-slate-800 capitalize">
                      {lastScanResult.attendance?.mealType || lastScanResult.mealType || 'Breakfast'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Date & Scan Time
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDateTime(lastScanResult.attendance?.scanTime || new Date())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Fallback Search Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Manual Search Fallback</h3>
                <p className="text-xs text-slate-500">
                  If resident's phone battery is discharged or camera fails
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Fallback
              </span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resident by name or room # (e.g. Rahul or 101)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Search Results list */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((t) => (
                  <div
                    key={t.allocationId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-all"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{t.tenant?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Room {t.roomNumber} ({t.bedNumber}) • {t.tenant?.phone}
                      </p>
                    </div>

                    {t.hasAttendedCurrentMeal ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                        Already Recorded
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTenantForManual(t);
                          setManualModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px]"
                      >
                        Record Attendance
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Attendance Confirmation Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Record Manual Meal Attendance"
        subtitle="This action is logged with manager audit trail"
      >
        {selectedTenantForManual && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{selectedTenantForManual.tenant?.name}</p>
              <p className="text-slate-600">
                Room {selectedTenantForManual.roomNumber} • {selectedTenantForManual.bedNumber}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Meal Session
              </label>
              <select
                value={manualMealType}
                onChange={(e) => setManualMealType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Audit Reason / Note
              </label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <button
              onClick={submitManualAttendance}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-2"
            >
              Confirm & Save Attendance
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
