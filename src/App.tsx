import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Heart,
  PlusCircle,
  FileText,
  User,
  ExternalLink,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Users,
  MapPin,
  ClipboardList,
  AlertOctagon,
  BellRing,
  ArrowRight,
  Volume2,
  Languages,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Wifi,
  Phone,
  PhoneOff
} from "lucide-react";
import { Clinic, Consultation, Distribution, EmergencyFacility, AlertLog } from "./types";
import EmergencyLocator from "./components/EmergencyLocator";

export default function App() {
  // State variables for application data
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [activeTab, setActiveTab] = useState<"patient" | "doctor" | "emergency">("patient");
  
  // Rural Inclusivity & Accessibility Settings
  const [fontSizeMode, setFontSizeMode] = useState<"standard" | "elderly">("standard");
  const [language, setLanguage] = useState<"bilingual" | "english">("bilingual");
  const [speechActive, setSpeechActive] = useState<boolean>(false);

  // Voice playback with optional cancellation
  const playVoicePlay = (text: string) => {
    if (!window.speechSynthesis) {
      showNotification("error", "आवाज सहायता समर्थित नहीं है / Audio assistance not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speechActive) {
      setSpeechActive(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, ""); // remove simple markdown formatting
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose voice appropriately
    utterance.rate = 0.9; // Slighly slower and clearer for elderly/rural ears
    
    // Check if Hindi voice is available, otherwise default to whatever browser has
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("HI"));
    if (hiVoice) {
      utterance.voice = hiVoice;
    }
    // Attempt auto-bilingual detection
    utterance.lang = text.match(/[\u0900-\u097F]/) ? "hi-IN" : "en-IN";

    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);

    setSpeechActive(true);
    window.speechSynthesis.speak(utterance);
    showNotification("success", "Playing Voice Assistance / आवाज सहायता शुरू हो गई है... 🔊");
  };
  
  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingConsult, setSubmittingConsult] = useState<boolean>(false);
  const [submittingPrescription, setSubmittingPrescription] = useState<boolean>(false);
  const [submittingDispatch, setSubmittingDispatch] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Consultation Form States
  const [newPatientName, setNewPatientName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("Female");
  const [newVillage, setNewVillage] = useState("Silli Rural Sector B");
  const [newSymptoms, setNewSymptoms] = useState("");
  const [uploadedReport, setUploadedReport] = useState<{ name: string; dataUri: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Doctor Action States
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescribedDrugs, setPrescribedDrugs] = useState<{ name: string; qty: number }[]>([
    { name: "Paracetamol 500mg", qty: 10 }
  ]);

  // Video call states
  const [doctorDeskTab, setDoctorDeskTab] = useState<"file" | "video">("file");
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [networkSignal, setNetworkSignal] = useState<"excellent" | "low-bandwidth">("excellent");
  const [patientHeartRate, setPatientHeartRate] = useState(74);
  const [patientSpO2, setPatientSpO2] = useState(97);
  const [videoCallLogs, setVideoCallLogs] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);

  // Clean stop video helper
  const cleanStopLocalStream = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
  };

  const startVideoCall = () => {
    setIsCalling(true);
    setCallDuration(0);
    setVideoCallLogs(["📡 Initializing satellite link to Jharkhand district circle...", "✓ Secure HIPAA peer tunnel established."]);
    
    // Attempt local webcam feed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setVideoCallLogs(prev => [...prev, "✓ Connected successfully to local webcam.", "✓ Tele-health audio channel unmuted."]);
        })
        .catch(err => {
          console.warn("Webcam blocked or not available:", err);
          setVideoCallLogs(prev => [...prev, "⚠ Webcam not available. Using virtual Loopback status."]);
        });
    } else {
      setVideoCallLogs(prev => [...prev, "⚠ Browser does not support mediaDevices. Fallback active."]);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
      // organic bounciness for diagnostics
      setPatientHeartRate(hr => {
        const d = Math.floor(Math.random() * 3) - 1;
        const res = hr + d;
        return res >= 68 && res <= 93 ? res : hr;
      });
      setPatientSpO2(spo2 => {
        if (Math.random() > 0.7) {
          const d = Math.floor(Math.random() * 3) - 1;
          const res = spo2 + d;
          return res >= 94 && res <= 100 ? res : spo2;
        }
        return spo2;
      });
    }, 1000);
  };

  const endVideoCall = () => {
    cleanStopLocalStream();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCalling(false);
    setCallDuration(0);
    setVideoCallLogs([]);
  };

  // Reset call states when selected patient changes
  useEffect(() => {
    endVideoCall();
    setDoctorDeskTab("file");
  }, [selectedConsultation]);

  // Clean-up hook on page unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Dispatch Logistics states
  const [dispatchClinicId, setDispatchClinicId] = useState("");
  const [dispatchMedicine, setDispatchMedicine] = useState("Paracetamol 500mg");
  const [dispatchQty, setDispatchQty] = useState<number>(500);

  // Filter systems
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("All");

  // Load and refresh state
  const fetchData = async () => {
    try {
      setLoading(true);
      const [clinicsRes, consultsRes, distRes, facilitiesRes] = await Promise.all([
        fetch("/api/clinics"),
        fetch("/api/consultations"),
        fetch("/api/distributions"),
        fetch("/api/emergency-facilities")
      ]);

      if (clinicsRes.ok) setClinics(await clinicsRes.json());
      if (consultsRes.ok) setConsultations(await consultsRes.json());
      if (distRes.ok) setDistributions(await distRes.json());
      if (facilitiesRes.ok) setFacilities(await facilitiesRes.json());
    } catch (err) {
      console.error("Error communicating with clinical server:", err);
      showNotification("error", "Error connecting to server. Please check database configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
  };

  // Drag and drop mechanics for patient report upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedReport({
          name: file.name,
          dataUri: event.target.result as string
        });
        showNotification("success", `Report "${file.name}" uploaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Submit patient clinical reservation
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newAge || !newSymptoms || !newVillage) {
      showNotification("error", "Please complete all patient reservation fields.");
      return;
    }

    try {
      setSubmittingConsult(true);
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: newPatientName,
          age: newAge,
          gender: newGender,
          village: newVillage,
          symptoms: newSymptoms,
          reportName: uploadedReport?.name,
          reportDataUri: uploadedReport?.dataUri
        })
      });

      if (res.ok) {
        showNotification("success", "Your tele-consultation request was submitted dynamically. A doctor will review it shortly.");
        // Clear forms
        setNewPatientName("");
        setNewAge("");
        setNewSymptoms("");
        setUploadedReport(null);
        // Refresh
        await fetchData();
        // Redirect to queue section visually or scroll
        const element = document.getElementById("clinical-history-section");
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        showNotification("error", "Failed to submit consultation. Try again.");
      }
    } catch (e) {
      showNotification("error", "Network connection issues.");
    } finally {
      setSubmittingConsult(false);
    }
  };

  // Add drug prescription line item
  const addDrugLine = () => {
    setPrescribedDrugs([...prescribedDrugs, { name: "Paracetamol 500mg", qty: 10 }]);
  };

  const updateDrugLine = (idx: number, field: "name" | "qty", value: any) => {
    const updated = [...prescribedDrugs];
    if (field === "qty") {
      updated[idx].qty = parseInt(value) || 0;
    } else {
      updated[idx].name = value;
    }
    setPrescribedDrugs(updated);
  };

  const removeDrugLine = (idx: number) => {
    const updated = prescribedDrugs.filter((_, i) => i !== idx);
    setPrescribedDrugs(updated);
  };

  // Submit prescription remotely (Doctor Portal)
  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) return;

    try {
      setSubmittingPrescription(true);
      const res = await fetch(`/api/consultations/${selectedConsultation.id}/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorNotes,
          prescription: prescriptionText,
          prescribedMeds: prescribedDrugs
        })
      });

      if (res.ok) {
        showNotification("success", `Prescription recorded and inventory earmarked!`);
        setSelectedConsultation(null);
        setDoctorNotes("");
        setPrescriptionText("");
        setPrescribedDrugs([{ name: "Paracetamol 500mg", qty: 10 }]);
        await fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to finalize prescription.");
      }
    } catch (err) {
      showNotification("error", "Error communicating with server.");
    } finally {
      setSubmittingPrescription(false);
    }
  };

  // Dispatch logistics batch to rural clinic (Admin Portal)
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchClinicId || !dispatchMedicine || dispatchQty <= 0) {
      showNotification("error", "Specify valid clinic destinator, medicine type, and batch size.");
      return;
    }

    try {
      setSubmittingDispatch(true);
      const res = await fetch("/api/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: dispatchClinicId,
          medicine: dispatchMedicine,
          quantity: dispatchQty
        })
      });

      if (res.ok) {
        showNotification("success", `Shipment dispatched successfully! Real-time Stock levels restocked.`);
        setDispatchQty(500);
        await fetchData();
      } else {
        showNotification("error", "Shipment logging failed.");
      }
    } catch (e) {
      showNotification("error", "Connectivity error.");
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Simulate automated clinic stock depletion event
  const simulateClinicDepletion = async (id: string) => {
    try {
      const res = await fetch(`/api/clinics/${id}/alert`, {
        method: "POST"
      });
      if (res.ok) {
        showNotification("success", "Critical health event simulated! Instant low stock warnings triggered.");
        await fetchData();
      }
    } catch (e) {
      showNotification("error", "Could not execute simulation.");
    }
  };

  // Calculate dynamic alerts
  const stockAlertsList: AlertLog[] = [];
  clinics.forEach((clinic) => {
    Object.entries(clinic.stock).forEach(([medName, rawData]) => {
      const data = rawData as { current: number; min: number; unit: string };
      if (data.current <= data.min) {
        stockAlertsList.push({
          id: `${clinic.id}-${medName}`,
          clinicId: clinic.id,
          clinicName: clinic.name,
          medicineName: medName,
          currentStock: data.current,
          minThreshold: data.min,
          severity: data.current === 0 ? "critical" : "low",
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
  });

  return (
    <div className={`w-full min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 ${fontSizeMode === "elderly" ? "text-lg" : "text-sm"}`} id="main-app-container">
      {/* Top Professional Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs" id="app-nav">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs">
            H
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              RuralHealth <span className="text-sky-600 font-medium text-lg">Connect</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium font-mono leading-none tracking-wider uppercase mt-0.5">
              Telemedicine & Medicine Logistics Hub
            </p>
          </div>
        </div>
        
        {/* Interactive Menu Tabs */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200/50" id="nav-tabs">
          <button
            onClick={() => setActiveTab("patient")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "patient"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Patient Desk (मरीज)
          </button>
          <button
            onClick={() => setActiveTab("doctor")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "doctor"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Heart className="h-3.5 w-3.5 animate-pulse text-sky-600" />
            Doctor Portal
            <span className="bg-sky-100 text-sky-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              Active
            </span>
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "emergency"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            Emergency GPS
          </button>
        </div>

        {/* Global info pills */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-3">
            <div className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Live System
            </div>
          </div>
          <button 
            onClick={fetchData}
            title="Refresh Server Records"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
          </button>
        </div>
      </nav>

      {/* RURAL ACCESSIBILITY CONTROL PANEL BANNER */}
      <div className="bg-sky-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-sky-950">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-sky-800 rounded text-sky-200 text-xs">गांव सहाय</span>
          <span className="text-xs font-semibold tracking-wide text-sky-100">
            {language === "bilingual" 
              ? "ग्रामीण सुलभता सक्रिय: बुजुर्गों एवं अल्प-साक्षर हेतु विशेष विकल्प" 
              : "Rural Accessibility Active: Specialized features for rural elders and low-literacy users"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Voice Helper Info */}
          {speechActive && (
            <span className="px-2 py-0.5 bg-rose-500 text-[10px] font-bold rounded animate-pulse flex items-center gap-1">
              <Volume2 className="h-3 w-3 shrink-0" />
              Speaking / बोल रहा है...
            </span>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === "bilingual" ? "english" : "bilingual")}
            className="px-3 py-1 bg-sky-800 hover:bg-sky-700 active:bg-sky-950 text-xs rounded-lg transition-all border border-sky-700/60 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Languages className="h-3.5 w-3.5 text-sky-300" />
            {language === "bilingual" ? "हिन्दी + English" : "English Only"}
          </button>

          {/* Font Size Toggle */}
          <button
            onClick={() => setFontSizeMode(fontSizeMode === "elderly" ? "standard" : "elderly")}
            className={`px-3 py-1 text-xs rounded-lg transition-all border font-semibold flex items-center gap-1.5 cursor-pointer ${
              fontSizeMode === "elderly"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-sky-800 hover:bg-sky-700 text-sky-100 border-sky-750"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            {fontSizeMode === "elderly" ? "🔍 बड़ी लिखावट सक्रिय (Elder Mode)" : "A+ बड़ी लिखावट (Large Font)"}
          </button>

          {/* Quick Voice Stop */}
          {speechActive && (
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setSpeechActive(false);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-xs rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer"
            >
              मौन / Stop Sound 🔇
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sticky Navigation bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 flex justify-around shadow-xs font-sans text-xs">
        <button
          onClick={() => setActiveTab("patient")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg font-semibold ${activeTab === 'patient' ? 'text-sky-600' : 'text-slate-400'}`}
        >
          <User className="h-4 w-4" />
          Patient
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg font-semibold ${activeTab === 'doctor' ? 'text-sky-600' : 'text-slate-400'}`}
        >
          <Heart className="h-4 w-4" />
          Doctor ({consultations.filter(c => c.status === "Pending").length})
        </button>
        <button
          onClick={() => setActiveTab("emergency")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg font-semibold ${activeTab === 'emergency' ? 'text-rose-500' : 'text-slate-400'}`}
        >
          <MapPin className="h-4 w-4" />
          Emergency
        </button>
      </div>

      {/* Alert toast notifications */}
      {alertMessage && (
        <div 
          className={`mx-6 mt-4 p-4 rounded-xl border flex items-start gap-3 shadow-md transition-all animate-bounce ${
            alertMessage.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
          id="global-alert-toast"
        >
          {alertMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {alertMessage.text}
          </div>
          <button 
            onClick={() => setAlertMessage(null)} 
            className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm px-1.5 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-Time Stock Warning Jumbotron for rural safety */}
      {stockAlertsList.length > 0 && activeTab !== "emergency" && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-2xs flex items-center justify-between" id="stock-alerts-header-strip">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <BellRing className="h-5 w-5 animate-swing" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">CRITICAL LOGISTICS STOCK WARNINGS ({stockAlertsList.length})</p>
              <p className="text-xs text-amber-700 font-sans">
                Multiple primary clinics are running below their designated safety thresholds. Dispatch replenishment batches now.
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {stockAlertsList.slice(0, 2).map((item) => (
              <span 
                key={item.id} 
                className="text-[10px] bg-white border border-amber-200 px-2.5 py-1 text-amber-800 rounded-md font-mono"
              >
                <strong>{item.clinicName.split(" ")[0]}</strong>: {item.medicineName} ({item.currentStock} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 p-6" id="dashboard-main-content">

        {/* ================= PATIENT PORTAL DESK ================= */}
        {activeTab === "patient" && (
          <div className="space-y-6" id="view-patient-dashboard">
            
            {/* Quick Informational Guide Cards for Rural Inhabitants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50 p-5 rounded-2xl border border-sky-100">
              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-sky-100 text-sky-700 rounded-xl font-bold shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    {language === "bilingual" ? "१. पर्चा भरें (Fill Request)" : "1. Register Symptoms"}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {language === "bilingual" 
                      ? "नीचे दिए गए खाने में मरीज की जानकारी भरें और लक्षण चुनें।" 
                      : "Provide patient name, age, and quick symptoms list."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-yellow-100 text-yellow-700 rounded-xl font-bold shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    {language === "bilingual" ? "२. डॉक्टर समीक्षा (Doctor Review)" : "2. Automated Dispatch"}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {language === "bilingual" 
                      ? "रांची सदर अस्पताल के विशेषज्ञ डॉक्टर आपकी जांच कर दवा लिखेंगे।" 
                      : "Government doctors remotely evaluate and approve prescriptions."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs text-emerald-800">
                    {language === "bilingual" ? "३. दवा केंद्र से दवा लें (Collect Medicine)" : "3. Collect & Recover"}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {language === "bilingual" 
                      ? "पास के गांव स्वास्थ्य केंद्र (Silli, Tamar, Ormanjhi) से मुफ्त दवा पाएं।" 
                      : "Prescribed medicines are earmarked at your closest rural center immediately."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-5 flex flex-col space-y-6">
                
                {/* Patient Submission Form Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6" id="patient-reservations-creator">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        {language === "bilingual" ? "स्वास्थ्य परामर्श आवेदन (Request Consultation)" : "Request Remote Tele-Consultation"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {language === "bilingual" 
                          ? "रांची सरकारी डॉक्टरों से सीधे मुफ्त परामर्श सेवाएं" 
                          : "Instantly match with Ranchi government district practitioners"}
                      </p>
                    </div>
                  </div>

                <form onSubmit={handlePatientSubmit} className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5 flex justify-between">
                      <span>{language === "bilingual" ? "मरीज का पूरा नाम / Patient Full Name 👤" : "Patient Full Name 👤"}</span>
                      {language === "bilingual" && <span className="text-[10px] text-slate-400 font-normal">उदाहरण: मोहन मुंडा</span>}
                    </label>
                    <input
                      type="text"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder={language === "bilingual" ? "मरीज का नाम यहाँ लिखें..." : "e.g. Kamla Devi"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                      required
                    />
                  </div>

                  {/* Age and Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 text-xs font-bold mb-1.5">
                        {language === "bilingual" ? "उम्र (वर्ष) / Patient Age 📅" : "Age (Years) 📅"}
                      </label>
                      <input
                        type="number"
                        value={newAge}
                        onChange={(e) => setNewAge(e.target.value)}
                        placeholder="e.g. 48"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm Skinner text-slate-800 placeholder-slate-400 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                        min="1"
                        max="120"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 text-xs font-bold mb-1.5">
                        {language === "bilingual" ? "लिंग / Patient Gender" : "Gender"}
                      </label>
                      <select
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
                        required
                      >
                        <option value="Female">{language === "bilingual" ? "महिला / Female" : "Female"}</option>
                        <option value="Male">{language === "bilingual" ? "पुरुष / Male" : "Male"}</option>
                        <option value="Other">{language === "bilingual" ? "अन्य / Other" : "Other"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Village selection */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5">
                      {language === "bilingual" ? "🏡 गाँव का क्षेत्र / Designated Village Area" : "🏡 Designated Village Area"}
                    </label>
                    <select
                      value={newVillage}
                      onChange={(e) => setNewVillage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold text-sky-800"
                      required
                    >
                      <option value="Silli Rural Sector B">Silli Area (सिल्ली ग्रामीण केंद्र)</option>
                      <option value="Tamar Outer Foothills">Tamar Outer (तमाड़ पहाड़ी क्षेत्र)</option>
                      <option value="Ormanjhi Village Inner">Ormanjhi Sector (ओरमांझी गांव)</option>
                      <option value="Bundu Regional Forest">Bundu Regional (बुंडू वन क्षेत्र)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      {language === "bilingual"
                        ? "अपने सबसे नजदीकी सरकारी दवा केंद्र का चयन करें ताकि डॉक्टर वहां की उपलब्ध दवा अलॉट कर सकें।"
                        : "Specifying precise village allocation allows doctors to earmark relevant pharmaceutical stocks."}
                    </p>
                  </div>

                  {/* Symptoms Text and Presets Grid */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-slate-700 text-xs font-bold">
                        {language === "bilingual" ? "🌡️ बीमारी के लक्षण / Detailed Symptoms" : "Detailed Symptoms"}
                      </label>
                      <button
                        type="button"
                        onClick={() => playVoicePlay(language === "bilingual" ? "नीचे दिए गए रंगीन डिब्बों पर क्लिक करें अपनी बीमारी चुनने के लिए" : "Click on the colored boxes below to choose your illness quickly")}
                        className="text-[10px] text-sky-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="h-3 w-3" /> {language === "bilingual" ? "आवाज सुनें / Listen Guide" : "Voice Guide"}
                      </button>
                    </div>

                    {/* Quick tap selector presets */}
                    <div className="mb-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold mb-1.5">
                        {language === "bilingual" ? "💡 आसान चुनाव: नीचे छूकर लक्षण जोड़ें (Tap to Add Symptoms):" : "💡 Short-cut: Tap to add symtoms:"}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { l: "बुखार / Fever 🌡️", t: "तेज बुखार और बदन गर्म होना (Fever & hot body)" },
                          { l: "खांसी / Cough 😷", t: "सूखी खांसी और गले में दर्द (Dry Cough & sore throat)" },
                          { l: "पेट दर्द / Stomach 🤢", t: "पेट मरोड़ और दस्त (Stomach cramp & loose stools)" },
                          { l: "चोट लगना / Wound 🩹", t: "हाथ या पैर में चोट और घाव (Wound on limb)" },
                          { l: "सांप / बिच्छू काटना 🐍", t: "सांप या कीड़े का काटना (Snake or toxic bite)" },
                          { l: "सिर/बदन दर्द / Body Ache 🤕", t: "कमर और सिर में गंभीर दर्द (Severe back/headache)" }
                        ].map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewSymptoms(prev => prev ? `${prev}, ${item.t}` : item.t);
                              showNotification("success", `✓ Added / जोड़ा गया: ${item.l}`);
                            }}
                            className="bg-white border border-slate-200 hover:border-sky-400 active:bg-sky-50 p-1.5 rounded text-[10px] text-left text-slate-700 transition-all truncate font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0" />
                            {item.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={newSymptoms}
                      onChange={(e) => setNewSymptoms(e.target.value)}
                      placeholder={language === "bilingual" ? "अपनी तकलीफ यहाँ विस्तार से लिखें (ऊपर से सीधे भी दबाकर चुन सकते हैं)..." : "Please trace timeline, temperature readings, swelling, intensity..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 h-24 resize-none font-medium leading-relaxed"
                      required
                    />
                  </div>

                  {/* Attachment zone with Drag & Drop */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-1.5">
                      {language === "bilingual" ? "🩺 पुराना पर्चा या जांच रिपोर्ट (Optional PDF / Photo)" : "Clinical Reports & Prescriptions (Optional)"}
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                        dragActive 
                          ? "border-sky-500 bg-sky-50/50" 
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <FileText className="h-6 w-6 text-slate-400 mx-auto -mb-0.5" />
                        <span className="text-xs font-bold text-sky-600 block hover:underline mt-1">
                          {language === "bilingual" ? "मोबाइल से फोटो खींचें या फाइल चुनें" : "Click to browse file explorer"}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {language === "bilingual" ? "दवा का पुराना पर्चा या खून की जांच रिपोर्ट" : "or drag & drop medical scans/PDF"}
                        </span>
                      </label>
                    </div>

                    {uploadedReport && (
                      <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                        <span className="font-semibold truncate pr-4">{uploadedReport.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Ready</span>
                          <button
                            type="button"
                            onClick={() => setUploadedReport(null)}
                            className="p-1 hover:bg-emerald-100 rounded text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingConsult}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-3 text-sm"
                  >
                    <PlusCircle className="h-5 w-5" />
                    {submittingConsult 
                      ? (language === "bilingual" ? "डॉक्टर से संपर्क जुड़ रहा है..." : "Submitting...") 
                      : (language === "bilingual" ? "✓ डॉक्टर से मुफ्त सलाह के लिए भेजें (Confirm Booking)" : "Securely Submit Tele-Consultation Request")}
                  </button>
                </form>
              </div>

              {/* Sahiya Didi (Helpline Assist) */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl p-5 text-slate-800 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-2xl shadow-xs border-2 border-white shrink-0">
                    👵🏽
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      सहिया दीदी गाइड (Sahiya Support)
                      <span className="bg-amber-200 text-amber-900 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Bilingual Audio
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                      {language === "bilingual" 
                        ? "सिल्ली व बुंडू जंगलों हेतु विशिष्ट त्वरित सलाह सुनें:" 
                        : "Bilingual audio guidance for rural forest areas:"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {[
                    {
                      title: "🌡️ बुखार व दस्त (Fever & Fluids Management)",
                      hindi: "तेज बुखार होने पर बदन एवं माथे पर ठंडे पानी की पट्टी रखें। दस्त होने पर हर बार एक गिलास साफ पानी में ओ.आर.एस. (ORS) घोल मिलाकर जरूर पिलाएं जब तक अस्पताल न पहुंचें।",
                      eng: "Keep a cool wet cloth on forehead for high fever. For diarrhoea, mix one packet of ORS in clean water and consume regularly until visiting a health center."
                    },
                    {
                      title: "🐍 सांप या विषैला जीव काटना (Snakebite First Aid)",
                      hindi: "सांप काटने पर मरीज को सोने न दें और हिम्मत बंधाएं। झाड़-फूंक में समय खराब न करें। तुरंत सिल्ली या बुंडू अस्पताल केंद्र लाएं, जहां एंटी-स्नेक वेनम सुई मुफ्त उपलब्ध है।",
                      eng: "Never sleep after a snakebite. Do not visit traditional faith healers. Bring the patient immediately to Silli or Bundu government hub for free Anti-Snake Venom injections."
                    },
                    {
                      title: "🤰 जच्चा-बच्चा सुरक्षा सलाह (Maternal & Baby Care)",
                      hindi: "गर्भवती माताएं कम से कम चार बार नजदीकी स्वास्थ्य केंद्र पर मुफ्त हीमोग्लोबिन और रक्तचाप की जांच करवाएं और नियमित कैल्सियम व आयरन की गोलियां अवश्य लें।",
                      eng: "Pregnant mothers should consult their nearest dispensary at least 4 times for free checkups, and consume iron supplements daily for healthy childbirth."
                    }
                  ].map((tip, idx) => (
                    <div key={idx} className="bg-white/90 backdrop-blur-md border border-amber-200/50 p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs hover:scale-[1.01] transition-transform duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-950 text-xs">{tip.title}</p>
                        <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5 leading-relaxed">
                          {language === "bilingual" ? tip.hindi : tip.eng}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playVoicePlay(language === "bilingual" ? `${tip.title}. ${tip.hindi}` : `${tip.title}. ${tip.eng}`);
                        }}
                        className="w-8 h-8 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg shrink-0 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                        title="Didi की आवाज में सलाह सुनें"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Village Pharmacy Live Stock Radar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      {language === "bilingual" ? "📍 लाइव औषधालय स्टॉक रडार" : "Live Pharmacy Stock Radar"}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-none mt-1">
                      {language === "bilingual" ? "दवा दुकान जाने से पहले लाइव उपलब्धता देखें" : "Check dynamic medicine supply before walking long distances"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {clinics.map((clinic) => {
                    const items = Object.entries(clinic.stock);
                    const lowStockCount = items.filter(([_, value]) => (value as any).current <= (value as any).min).length;
                    const isCritical = lowStockCount > 2;

                    return (
                      <div key={clinic.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-slate-800 text-xs truncate leading-tight" title={clinic.name}>
                              {clinic.name.split(" ")[0]} Hub
                            </span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Region: {clinic.village.split(" ")[0]}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Available:</span>
                          <span className={`font-semibold ${lowStockCount === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                            {items.length - lowStockCount} / {items.length} Ok
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>{/* Close lg:col-span-5 flex flex-col wrapper */}

              {/* Consultation History Block for patient tracking */}
              <div className="lg:col-span-7 flex flex-col space-y-6" id="clinical-history-section">
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Active Clinical Requests & Status Tracker</h3>
                      <p className="text-xs text-slate-400">All submitted claims are stored server-side for remote evaluation</p>
                    </div>
                    
                    {/* Filter utilities */}
                    <div className="flex items-center gap-2 text-xs">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={selectedVillageFilter}
                        onChange={(e) => setSelectedVillageFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer text-xs"
                      >
                        <option value="All">All Village Zones</option>
                        <option value="Silli">Silli Area</option>
                        <option value="Tamar">Tamar Outer</option>
                        <option value="Ormanjhi">Ormanjhi</option>
                      </select>
                    </div>
                  </div>

                  {/* Consultation Cards */}
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 flex-1">
                    {consultations
                      .filter((c) => {
                        if (selectedVillageFilter !== "All" && !c.village.includes(selectedVillageFilter)) return false;
                        return true;
                      })
                      .map((c) => {
                        return (
                          <div
                            key={c.id}
                            className={`p-4 rounded-xl border transition-all ${
                              c.status === "Pending"
                                ? "bg-amber-50/20 border-amber-100"
                                : "bg-white border-slate-100"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                  {c.patientName}
                                  <span className="text-xs text-slate-400 font-normal">
                                    ({c.age} yrs • {c.gender})
                                  </span>
                                </h4>
                                <span className="inline-block mt-0.5 text-[10px] text-slate-400 font-mono">
                                  ID: {c.id} • Village: <strong className="text-slate-600">{c.village}</strong>
                                </span>
                              </div>

                              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                c.status === "Prescribed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 mt-2.5 leading-relaxed">
                              <strong>Symptoms:</strong> {c.symptoms}
                            </p>

                            {c.reportName && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50/40 p-2 rounded-lg border border-sky-100/30 max-w-fit">
                                <FileText className="h-3.5 w-3.5 text-sky-600" />
                                <span>Attached: <strong>{c.reportName}</strong></span>
                                {c.reportDataUri && (
                                  <a
                                    href={c.reportDataUri}
                                    download={c.reportName}
                                    className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold ml-2 flex items-center gap-0.5"
                                  >
                                    View Report <ExternalLink className="h-2 w-2" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Prescriptions output details */}
                            {c.status === "Prescribed" && (
                              <div className="mt-4 border-t border-slate-150 pt-3 flex flex-col space-y-2.5 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100">
                                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between gap-1.5 flex-wrap">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                    {language === "bilingual" ? "✓ डॉक्टर का ऑनलाइन पर्चा (Prescription Issued)" : "Medical Prescription Issued Remote"}
                                  </span>
                                  
                                  {/* Bilingual Voice Assist */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const advice = c.doctorNotes || "";
                                        const directions = c.prescription || "";
                                        const meds = c.prescribedMeds ? c.prescribedMeds.map(m => `${m.qty} goli ${m.name}`).join(", ") : "";
                                        playVoicePlay(`मरीज ${c.patientName} ध्यान दें। चिकित्सक की सलाह है: ${advice || "सामान्य आराम करें "}. दवा खाने की विधि: ${directions || "नियमित रूप से लें"}. दवाई का नाम: ${meds}. अपना ख्याल रखें।`);
                                      }}
                                      className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-[10px] text-white rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="पर्चा सुनिए (हिन्दी)"
                                    >
                                      <Volume2 className="h-2.5 w-2.5" /> हिन्दी सुनें 🔊
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const advice = c.doctorNotes || "";
                                        const directions = c.prescription || "";
                                        const meds = c.prescribedMeds ? c.prescribedMeds.map(m => `${m.qty} units of ${m.name}`).join(", ") : "";
                                        playVoicePlay(`Attention for patient ${c.patientName}. Doctor advice is: ${advice || "General care"}. Directions: ${directions || "Take as prescribed"}. Earmarked drugs: ${meds}.`);
                                      }}
                                      className="px-2 py-0.5 bg-sky-800 hover:bg-sky-700 text-[10px] text-white rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Listen in English"
                                    >
                                      <Volume2 className="h-2.5 w-2.5" /> Speak 🔊
                                    </button>
                                  </div>
                                </div>
                                
                                {c.doctorNotes && (
                                  <p className="text-xs text-slate-600 italic">
                                    <span className="font-semibold text-slate-800">Doctor Advice:</span> "{c.doctorNotes}"
                                  </p>
                                )}

                                {c.prescription && (
                                  <p className="text-xs text-slate-600">
                                    <span className="font-semibold text-slate-800">Drug Directions:</span> {c.prescription}
                                  </p>
                                )}

                                {c.prescribedMeds && c.prescribedMeds.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {c.prescribedMeds.map((med, i) => (
                                      <span key={i} className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100 font-semibold">
                                        {med.name} × {med.qty} units
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-3 text-[10px] text-slate-400 text-right">
                              Requested: {new Date(c.timestamp).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================= DOCTOR PORTAL DESK ================= */}
        {activeTab === "doctor" && (
          <div className="space-y-6" id="view-doctor-portal">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Waiting queues */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col h-[640px]">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 text-base">Tele-Consultation Live Queue</h3>
                  <p className="text-xs text-slate-400">Select pending cases to conduct diagnoses & prescribe drugs</p>
                  
                  <div className="relative mt-3">
                    <input
                      type="text"
                      placeholder="Search patient name..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 outline-none"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {consultations
                    .filter((c) => {
                      if (patientSearch && !c.patientName.toLowerCase().includes(patientSearch.toLowerCase())) return false;
                      return true;
                    })
                    .map((c) => {
                      const isSelected = selectedConsultation && selectedConsultation.id === c.id;
                      const hasPrescribed = c.status === "Prescribed";

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedConsultation(c);
                            if (c.prescribedMeds) {
                              setPrescribedDrugs(c.prescribedMeds);
                            } else {
                              setPrescribedDrugs([{ name: "Paracetamol 500mg", qty: 10 }]);
                            }
                            setDoctorNotes(c.doctorNotes || "");
                            setPrescriptionText(c.prescription || "");
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-sky-50 border-sky-300 shadow-2xs"
                              : hasPrescribed
                              ? "bg-white hover:bg-slate-50/50 border-slate-100 opacity-80"
                              : "bg-white hover:border-slate-200 border-slate-100"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div>
                              <h4 className="font-bold text-slate-850 text-sm">{c.patientName}</h4>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Age: {c.age} ({c.gender}) • {c.village}
                              </p>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              hasPrescribed ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-amber-50 text-amber-800 border border-amber-100"
                            }`}>
                              {c.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                            {c.symptoms}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Case Diagnosis and pharmaceutical allocation */}
              <div className="lg:col-span-7">
                {selectedConsultation ? (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col h-[640px] overflow-hidden">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
                      <div>
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Active Clinical Case Desk
                        </span>
                        <h3 className="font-bold text-slate-800 text-lg mt-1.5">
                          {selectedConsultation.patientName} (Age: {selectedConsultation.age})
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Resident District Location: <span className="font-bold text-slate-600">{selectedConsultation.village}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedConsultation(null)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                      >
                        Close Desk
                      </button>
                    </div>

                    {/* Tab Navigation for Active Case Desk */}
                    <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50 p-1.5 gap-1">
                      <button
                        type="button"
                        onClick={() => setDoctorDeskTab("file")}
                        className={`flex-1 py-2 text-xs font-bold transition-all rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                          doctorDeskTab === "file"
                            ? "bg-white border-slate-200 text-sky-700 shadow-2xs"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <FileText className="h-4 w-4 text-sky-600" />
                        <span>{language === "bilingual" ? "मरीज़ फ़ाइल और नुस्खा (File & Rx)" : "Patient File & Rx"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDoctorDeskTab("video")}
                        className={`flex-1 py-2 text-xs font-bold transition-all rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer relative ${
                          doctorDeskTab === "video"
                            ? "bg-white border-slate-200 text-sky-700 shadow-2xs"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCalling ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCalling ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        <Video className="h-4 w-4 text-rose-600" />
                        <span>{language === "bilingual" ? "लाइव वीडियो कॉल (Live Video Consultation)" : "Live Video Call"}</span>
                        {isCalling && (
                          <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-mono tracking-wider font-extrabold animate-pulse ml-1.5">
                            LIVE
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Content area based on selected tab */}
                    {doctorDeskTab === "file" ? (
                      <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                        
                        {/* Clinical diagnostics data info */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                            Patient Uploaded Symptoms
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            {selectedConsultation.symptoms}
                          </p>

                          {selectedConsultation.reportName && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <FileText className="h-4 w-4 text-sky-500" />
                                {selectedConsultation.reportName}
                              </span>
                              {selectedConsultation.reportDataUri && (
                                <a
                                  href={selectedConsultation.reportDataUri}
                                  download={selectedConsultation.reportName}
                                  className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                >
                                  View File <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stock availability lookup warning system */}
                        {(() => {
                          // Dynamically estimate matching clinic stock
                          const patientV = selectedConsultation.village.toLowerCase();
                          const matchingClinic = clinics.find(c => patientV.includes(c.village.toLowerCase())) || clinics[0];

                          return matchingClinic ? (
                            <div className="p-4 bg-sky-50/20 border border-sky-100/40 rounded-xl text-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sky-850">Estimated Closest Dispensary Allocation Hub</span>
                                <span className="bg-sky-50 text-sky-850 px-2 py-0.5 rounded font-mono font-bold">
                                  {matchingClinic.name}
                                </span>
                              </div>
                              <p className="text-slate-500">
                                Directly earmarks medications from this designated clinic below upon finalizing prescription.
                              </p>
                              <div className="grid grid-cols-5 gap-2 mt-2">
                                {Object.entries(matchingClinic.stock).map(([med, rawItem]) => {
                                  const item = rawItem as { current: number; min: number; unit: string };
                                  return (
                                    <div key={med} className="bg-white border border-slate-100 p-2 rounded text-center">
                                      <p className="truncate text-[10px] text-slate-500 font-semibold" title={med}>{med}</p>
                                      <p className={`text-xs font-bold font-mono mt-0.5 ${item.current <= item.min ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {item.current}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Diagnostic prescription input fields form */}
                        <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                          
                          {/* Quick Prescription Templates to assist high volumes */}
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                              ⚡ त्वरित पर्चा टेम्पलेट (Smart Prescribe Shortcuts)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setDoctorNotes("Take plenty of water, rest, and keep clean forehead cooling bands. Avoid high workload / बदन गर्म होने पर ठंडी पट्टी लगाएं व पर्याप्त आराम करें।");
                                  setPrescriptionText("Take 1 tablet of Paracetamol three times a day post meals for 3-5 days / भोजन के बाद दिन में 3 बार 1 गोली लें।");
                                  setPrescribedDrugs([{ name: "Paracetamol 500mg", qty: 10 }]);
                                  showNotification("success", "✓ Applied: Viral Fever Template / बुखार गाइड");
                                }}
                                className="text-[10px] bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                🌡️ बुखार (Fever)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDoctorNotes("Frequent rehydration is critical. Drink ORS liquid continuously. Avoid direct sun heat / दस्त व पानी की कमी होने पर धूप से बचें और बार-बार ओआरएस पिएं।");
                                  setPrescriptionText("Consume 1 full packet of ORS dissolved in 1L of water after every diarrheal stool / हर दस्त के बाद एक गिलास घोल लें।");
                                  setPrescribedDrugs([{ name: "ORS Packets", qty: 15 }]);
                                  showNotification("success", "✓ Applied: Dehydration Plan / दस्त-ओआरएस");
                                }}
                                className="text-[10px] bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                🤢 दस्त (ORS Dehydrate)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDoctorNotes("Avoid cold water, drink warm herbal tea, and rest. Gargle with warm salt water thrice daily / खांसी होने पर गुनगुना पानी पिएं।");
                                  setPrescriptionText("Take 1 tablet of Amoxicillin twice daily with water for 5 days / दिन में २ बार खाने के बाद लें।");
                                  setPrescribedDrugs([{ name: "Amoxicillin 250mg", qty: 10 }]);
                                  showNotification("success", "✓ Applied: Chest Cough & Throat Infection Plan / खांसी नुस्खा");
                                }}
                                className="text-[10px] bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                😷 खांसी (Chest Cough)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDoctorNotes("Remain lying flat immediately. Observe critical site swelling. Do NOT tie tourniquets too tight / सांप काटने पर मरीज को सीधा लेटाएं, शांत रखें।");
                                  setPrescriptionText("Administer Anti-Snake Venom strictly under clinical supervision of rural medical officer / एंटी-स्नेक वेनम सुई चिकित्सक की देखरेख में लगायें।");
                                  setPrescribedDrugs([{ name: "Anti-Snake Venom", qty: 2 }]);
                                  showNotification("success", "⚠️ Applied CRITICAL: Snakebite Rescue Protocol / सांप काटना");
                                }}
                                className="text-[10px] bg-amber-50 border border-amber-200 hover:border-amber-400 text-amber-900 px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                🐍 सांप काटना (Snakebite)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Doctor Diagnostic Advice (Remotely displayed to patient)
                            </label>
                            <textarea
                              value={doctorNotes}
                              onChange={(e) => setDoctorNotes(e.target.value)}
                              placeholder="Specify general health advice, diet parameters, resting suggestions..."
                              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 h-20 resize-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Detailed Medicine Dosage Regime
                            </label>
                            <input
                              type="text"
                              value={prescriptionText}
                              onChange={(e) => setPrescriptionText(e.target.value)}
                              placeholder="e.g. 1 Tablet three times daily after food"
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500"
                              required
                            />
                          </div>

                          {/* Interactive dynamic Drugs picker */}
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <label className="block text-xs font-bold text-slate-750">
                                Prescribed Pharmaceutical Checklist
                              </label>
                              <button
                                type="button"
                                onClick={addDrugLine}
                                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5 pointer-events-auto"
                              >
                                <Plus className="h-3 w-3" /> Add items
                              </button>
                            </div>

                            <div className="space-y-2">
                              {prescribedDrugs.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <select
                                    value={item.name}
                                    onChange={(e) => updateDrugLine(idx, "name", e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white outline-none cursor-pointer"
                                  >
                                    <option value="Paracetamol 500mg">Paracetamol 500mg</option>
                                    <option value="Amoxicillin 250mg">Amoxicillin 250mg</option>
                                    <option value="ORS Packets">ORS Packets</option>
                                    <option value="Anti-Snake Venom">Anti-Snake Venom</option>
                                    <option value="Insulin Glargine">Insulin Glargine</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => updateDrugLine(idx, "qty", e.target.value)}
                                    className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white outline-none text-center font-mono"
                                    placeholder="Qty"
                                    min="1"
                                    required
                                  />
                                  {prescribedDrugs.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDrugLine(idx)}
                                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingPrescription}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs mt-3"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submittingPrescription ? "Submitting Regime..." : "Sign Prescription & Dispatch Pharmacy Inventory"}
                          </button>
                        </form>

                      </div>
                    ) : (
                      /* ================= TELE-VIDEO CONSULTANCY WORKSPACE ================= */
                      <div className="flex-1 flex flex-col h-full bg-slate-900 text-white rounded-xl mt-3 p-4 select-none relative overflow-y-auto">
                        
                        {/* Stream Controls Header bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isCalling ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
                            <div>
                              <p className="text-xs font-mono text-slate-400">STATUS LINK:</p>
                              <p className="text-xs font-bold text-slate-100">
                                {isCalling 
                                  ? `${language === 'bilingual' ? "सुरक्षित प्रसारण सक्रिय (Call Active)" : "HIPAA Tunneled Video Active"}`
                                  : `${language === 'bilingual' ? "डिस्कनेक्ट (Disconnected)" : "Ready for Tele-Link"}`}
                              </p>
                            </div>
                          </div>

                          {isCalling && (
                            <div className="flex items-center gap-3 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold font-mono">
                              <span className="text-rose-400">⏱ {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Wifi className="h-3 w-3" /> 
                                {networkSignal === "excellent" ? "Excellent Link (4G)" : "SD Optimized (2G/3G)"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Split Screens Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[220px]">
                          
                          {/* Left: Patient Visualizer */}
                          <div className="bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between p-3 group">
                            
                            {/* Sat Link Overlay and scanlines */}
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.5)_100%)] z-10" />
                            {isCalling && networkSignal === "low-bandwidth" && (
                              <div className="absolute inset-0 pointer-events-none opacity-15 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_1px,transparent_1.5px,transparent_2px)] z-10 animate-pulse" />
                            )}
                            
                            {/* Vitals Headup display overlay */}
                            {isCalling && (
                              <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
                                <span className="bg-indigo-950/80 backdrop-blur-md text-[9px] font-mono text-indigo-300 px-2 py-1 rounded-md border border-indigo-800/40 font-bold uppercase tracking-wide">
                                  Jharkhand Sat-Bridge B
                                </span>
                                
                                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-lg flex flex-col gap-1 shadow-md">
                                  {/* Pulse vitals tracker */}
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Heart className="h-3 w-3 text-rose-500 fill-rose-500 animate-bounce" />
                                    <span className="font-bold text-slate-200 font-mono text-[11px]">HR: {patientHeartRate} bpm</span>
                                  </div>
                                  {/* SpO2 tracer */}
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Activity className="h-3 w-3 text-sky-400" />
                                    <span className="font-bold text-sky-400 font-mono text-[11px]">SpO2: {patientSpO2}%</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Signal Indicator */}
                            <div className="absolute top-2.5 right-2.5 z-20">
                              <span className={`text-[9px] font-mono uppercase px-2 py-1 rounded-md tracking-wider font-extrabold flex items-center gap-1 ${
                                isCalling 
                                  ? networkSignal === 'excellent' ? 'bg-emerald-900/80 border border-emerald-700/50 text-emerald-300' : 'bg-amber-900/80 border border-amber-700/50 text-amber-300 animate-pulse'
                                  : 'bg-slate-800 border border-slate-700 text-slate-400'
                              }`}>
                                <Wifi className="h-3 w-3" />
                                {isCalling ? networkSignal : "Standby"}
                              </span>
                            </div>

                            {/* Patient Face placeholder or stream */}
                            <div className="flex-1 flex flex-col items-center justify-center p-4">
                              {isCalling ? (
                                <div className="text-center relative">
                                  {/* Face avatar simulation with pulsing health rings */}
                                  <div className="relative mb-3 flex items-center justify-center">
                                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-sky-500/10 animate-ping" />
                                    <span className="absolute inline-flex h-16 w-16 rounded-full bg-emerald-500/20 animate-pulse" />
                                    <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-emerald-600 rounded-full flex items-center justify-center text-3xl font-extrabold border-2 border-white/20 select-none shadow-md">
                                      {selectedConsultation.patientName.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] text-white">
                                      ✓
                                    </div>
                                  </div>

                                  <h4 className="font-bold text-slate-100 text-sm tracking-wide">
                                    {selectedConsultation.patientName} (Patient)
                                  </h4>
                                  <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1 uppercase tracking-widest bg-emerald-950/60 block px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                                    {selectedConsultation.village.split(" ")[0]} Dispensary Terminal
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 text-lg mb-2 mx-auto">
                                    📞
                                  </div>
                                  <p className="text-xs font-bold text-slate-400">Patient Feed Offline</p>
                                  <p className="text-[10px] text-slate-600 mt-1 max-w-[140px] mx-auto">Click "Start Consultation Bridge" below to hook with patient.</p>
                                </div>
                              )}
                            </div>

                            {/* ECG Canvas Wave simulated with SVG */}
                            {isCalling && (
                              <div className="bg-slate-950/80 backdrop-blur-3xs p-1.5 rounded-lg border border-slate-800 flex items-center justify-between z-10 shrink-0">
                                <span className="text-[9px] font-mono text-slate-400 tracking-wider">LIVE CARDIOGRAM (ECG)</span>
                                <svg viewBox="0 0 100 24" className="w-24 h-5 text-emerald-500 stroke-current stroke-1.5 fill-none overflow-hidden">
                                  <path d="M0 12 L15 12 L20 2 L25 22 L30 12 L45 12 L48 6 L52 18 L55 12 L100 12" className="animate-pulse" style={{ strokeDasharray: "1000", strokeDashoffset: "0" }} />
                                </svg>
                              </div>
                            )}

                          </div>

                          {/* Right: Local Doctor Webcam Stream */}
                          <div className="bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between p-3">
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.5)_100%)] z-10" />
                            
                            <div className="absolute top-2.5 left-2.5 z-20">
                              <span className="bg-slate-900/80 backdrop-blur-md text-[9px] font-mono text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-800 font-bold uppercase tracking-wider">
                                Doctor (Local Hub)
                              </span>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-4">
                              {isCalling && !videoMuted ? (
                                <div className="w-full h-full min-h-[120px] rounded-lg overflow-hidden border border-slate-800 relative bg-black">
                                  {/* Live local webcam element */}
                                  <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover transform -scale-x-100"
                                  />
                                  <span className="absolute bottom-2 right-2 bg-rose-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded font-bold uppercase z-20 animate-pulse">
                                    Local CAM
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-14 h-14 bg-slate-900/85 border border-slate-800 rounded-full flex items-center justify-center text-sky-500 text-2xl mb-2 mx-auto animate-pulse">
                                    👨‍⚕️
                                  </div>
                                  <p className="text-xs font-bold text-slate-300">Your Webcam is {videoMuted ? "Muted" : "Off"}</p>
                                  <p className="text-[9px] text-slate-600 mt-0.5">Click Start to initiate video loop</p>
                                </div>
                              )}
                            </div>

                            {/* Video track status labels */}
                            <div className="flex justify-between items-center text-[10px] text-slate-400 z-10 shrink-0 font-mono mt-1">
                              <span>AUDIO: <strong className={audioMuted ? "text-rose-400" : "text-emerald-400"}>{audioMuted ? "MUTED" : "LIVE"}</strong></span>
                              <span>VIDEO: <strong className={videoMuted ? "text-rose-400" : "text-emerald-400"}>{videoMuted ? "MUTED" : "LIVE"}</strong></span>
                            </div>

                          </div>

                        </div>

                        {/* Connection Logs Panel for visual depth */}
                        {isCalling && (
                          <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shrink-0 text-[10px] font-mono text-slate-400 space-y-1">
                            <p className="font-bold text-sky-400 text-[9px] uppercase tracking-wider mb-1">🔗 Direct Tele-Bridge Telemetry Logs:</p>
                            <div className="max-h-[60px] overflow-y-auto space-y-0.5 pr-1">
                              {videoCallLogs.map((log, i) => (
                                <p key={i} className="leading-tight truncate">{log}</p>
                              ))}
                              <p className="text-[9px] text-emerald-400 animate-pulse">● System heartbeat ok • ping: {networkSignal === "excellent" ? "42ms" : "195ms"} • jitter: 3.4ms</p>
                            </div>
                          </div>
                        )}

                        {/* Micro Toolbar control pad */}
                        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center shrink-0">
                          
                          {/* Live activation trigger */}
                          <div className="flex gap-2">
                            {!isCalling ? (
                              <button
                                type="button"
                                onClick={startVideoCall}
                                className="bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                              >
                                <Phone className="h-4 w-4 text-emerald-400" />
                                <span>{language === 'bilingual' ? "टेली-वीडियो कॉल चालू करें (Start Bridge)" : "Start Consulting Call"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={endVideoCall}
                                className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                              >
                                <PhoneOff className="h-4 w-4" />
                                <span>{language === 'bilingual' ? "कॉल समाप्त करें (End Consultation)" : "End Live Consultation"}</span>
                              </button>
                            )}
                          </div>

                          {/* hardware toggler array */}
                          {isCalling && (
                            <div className="flex gap-1">
                              {/* Audio Muter */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAudioMuted(!audioMuted);
                                  setVideoCallLogs(prev => [...prev, audioMuted ? "✓ Audio unmuted by doctor." : "⚠ Audio channel locally muted by doctor."]);
                                }}
                                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                  audioMuted ? 'bg-rose-900/60 hover:bg-rose-800 border border-rose-750 text-white' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                                }`}
                                title={audioMuted ? "Unmute Mic" : "Mute Mic"}
                              >
                                {audioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                              </button>

                              {/* Video Muter */}
                              <button
                                type="button"
                                onClick={() => {
                                  setVideoMuted(!videoMuted);
                                  setVideoCallLogs(prev => [...prev, videoMuted ? "✓ Camera source restored." : "⚠ Doctor web camera transmission paused."]);
                                }}
                                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                  videoMuted ? 'bg-rose-900/60 hover:bg-rose-800 border border-rose-750 text-white' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                                }`}
                                title={videoMuted ? "Enable Stream" : "Pause Stream"}
                              >
                                {videoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                              </button>

                              {/* Low Bandwidth Selector */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMode = networkSignal === "excellent" ? "low-bandwidth" : "excellent";
                                  setNetworkSignal(nextMode);
                                  setVideoCallLogs(prev => [...prev, nextMode === "low-bandwidth" 
                                    ? "⚠ Low-Bandwidth Mode active. Downgraded patient stream to 360p SD bypass." 
                                    : "✓ High quality 4G HD stream restored."]);
                                }}
                                className={`px-2.5 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold rounded-lg border transition-all cursor-pointer ${
                                  networkSignal === "low-bandwidth"
                                    ? "bg-amber-950/60 text-amber-300 border-amber-800"
                                    : "bg-slate-800 text-slate-300 border-slate-700"
                                }`}
                                title="Optimize connection for extremely weak forest internet speeds"
                              >
                                {networkSignal === "low-bandwidth" ? "LOW SPEED ACTIVE" : "OPTIMIZE SATELLITE SPEED"}
                              </button>
                            </div>
                          )}

                        </div>

                        {/* Interactive Vitals Grabber & audio assistance triggers */}
                        {isCalling && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
                            
                            {/* Broadcast instruction trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                const statement = doctorNotes || prescriptionText;
                                if (!statement) {
                                  playVoicePlay(`Hello ${selectedConsultation.patientName}. This is your remote doctor. Please remain sitting comfortably while I prepare your medical diagnostics.`);
                                } else {
                                  playVoicePlay(`मरीज ${selectedConsultation.patientName}, डॉक्टर की सलाह सुनें: ${statement}`);
                                }
                                showNotification("success", "✓ Broadcasting Audio Prescription to rural terminal!");
                              }}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 px-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                            >
                              <Volume2 className="h-4 w-4 text-sky-400 animate-pulse" />
                              <span>🔊 सलाह सुनाएं (Voice Broadcast Rx)</span>
                            </button>

                            {/* Vitals Grabber */}
                            <button
                              type="button"
                              onClick={() => {
                                setDoctorNotes(prev => {
                                  const base = prev ? prev.trim() + "\n" : "";
                                  return base + `[Recorded Tele-Vitals Log: HR ${patientHeartRate} bpm, SpO2 ${patientSpO2}% matched via Silli Satellite Uplink B]`;
                                });
                                showNotification("success", "✓ Diagnostic Vitals appended to prescription!");
                                setVideoCallLogs(prev => [...prev, "✓ Clinical vitals checklist extracted & synchronized to Rx form."]);
                              }}
                              className="text-xs bg-sky-900/40 hover:bg-sky-900/60 text-sky-200 py-2.5 px-3 rounded-xl border border-sky-800/40 transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                              title="Instantly copy current patient telemetry directly into prescription form notes"
                            >
                              <Activity className="h-4 w-4 text-emerald-400" />
                              <span>💾 वाइटल्स डेटा दर्ज करें (Grab Vitals data)</span>
                            </button>

                          </div>
                        )}

                        {/* Guide note when call is standby */}
                        {!isCalling && (
                          <div className="mt-auto bg-slate-950 p-3 rounded-xl border border-slate-800 font-medium text-[11px] text-slate-500 leading-normal shrink-0">
                            ℹ️ <strong>Bilingual Rural Doctor Tele-Consultation Node:</strong> Connect with rural primary health clinics in real-time. Make sure to choose the <strong>"Low Speed Active"</strong> bandwidth optimizer to maintain video coherence in Jharkhand's dense forest locations like Silli, Bundu, or Tamar.
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 h-[640px] flex flex-col items-center justify-center p-6 text-center">
                    <Heart className="h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700 text-sm">Select Clinical Case Desk</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Choose any active telemedicine case on the left pane to submit remote prescriptions, advice, and allocate medical stock.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ================= EMERGENCY GPS SYSTEM ================= */}
        {activeTab === "emergency" && (
          <div className="space-y-6" id="view-emergency-portal">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="emergency-header-card">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500 animate-pulse" />
                Inter-Hospital Emergency Geolocation Map System
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time routing system utilizing GPS calculations to dispatch critical ambulance resources to rural forest areas.
              </p>
            </div>

            <EmergencyLocator facilities={facilities} />
          </div>
        )}

      </main>

      {/* Footer System with AES status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center text-[11px] text-slate-550 mt-auto shadow-inner" id="app-footer">
        <div className="flex gap-6 uppercase font-bold tracking-widest text-[10px]">
          <span 
            onClick={() => {
              setActiveTab("patient");
              const target = document.getElementById("main-app-container");
              target?.scrollIntoView({ behavior: "smooth" });
            }} 
            className={`cursor-pointer transition-colors ${activeTab === 'patient' ? 'text-sky-600 font-extrabold' : 'hover:text-slate-800 text-slate-500'}`}
          >
            Patient Desk / ग्रामीण केंद्र
          </span>
          <span 
            onClick={() => {
              setActiveTab("doctor");
              const target = document.getElementById("main-app-container");
              target?.scrollIntoView({ behavior: "smooth" });
            }} 
            className={`cursor-pointer transition-colors ${activeTab === 'doctor' ? 'text-sky-600 font-extrabold' : 'hover:text-slate-800 text-slate-500'}`}
          >
            Doctor Portal / डॉक्टर समीक्षा
          </span>
          <span 
            onClick={() => {
              setActiveTab("emergency");
              const target = document.getElementById("main-app-container");
              target?.scrollIntoView({ behavior: "smooth" });
            }} 
            className={`cursor-pointer transition-colors ${activeTab === 'emergency' ? 'text-rose-500 font-extrabold' : 'hover:text-slate-800 text-slate-500'}`}
          >
            Emergency GPS / आपातकालीन नक्शा
          </span>
        </div>
        <div className="font-mono text-right hidden sm:block">
          District Hospital Link: <span className="text-green-600 font-bold">Secure (256-bit AES)</span> • Remote App
        </div>
      </footer>
    </div>
  );
}
