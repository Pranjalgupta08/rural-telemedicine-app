import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Clinic {
  id: string;
  name: string;
  village: string;
  lat: number;
  lng: number;
  stock: {
    [key: string]: {
      current: number;
      min: number;
      unit: string;
    }
  };
}

interface Consultation {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  village: string;
  symptoms: string;
  reportName?: string;
  reportDataUri?: string;
  timestamp: string;
  status: "Pending" | "Reviewed" | "Prescribed";
  doctorNotes?: string;
  prescription?: string;
  prescribedMeds?: { name: string; qty: number }[];
}

interface Distribution {
  id: string;
  clinicId: string;
  clinicName: string;
  medicine: string;
  quantity: number;
  dispatchedAt: string;
  status: "Dispatched" | "In Transit" | "Delivered";
}

interface EmergencyFacility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  contact: string;
  bedsAvailable: number;
  hasICU: boolean;
  hasAmbulance: boolean;
}

// Pre-seeded Health Clinics in a rural district (e.g. Ranchi Rural Belt)
let clinics: Clinic[] = [
  {
    id: "clinic-1",
    name: "Silli Primary Health Centre",
    village: "Silli",
    lat: 23.3524,
    lng: 85.8153,
    stock: {
      "Paracetamol 500mg": { current: 1500, min: 500, unit: "tablets" },
      "Amoxicillin 250mg": { current: 120, min: 200, unit: "tablets" }, // LOW STOCK ALERT
      "ORS Packets": { current: 400, min: 100, unit: "sachets" },
      "Anti-Snake Venom": { current: 2, min: 10, unit: "vials" }, // CRITICAL ALERT
      "Insulin Glargine": { current: 15, min: 20, unit: "vials" } // LOW STOCK ALERT
    }
  },
  {
    id: "clinic-2",
    name: "Tamar Community Health Centre",
    village: "Tamar",
    lat: 23.0489,
    lng: 85.6418,
    stock: {
      "Paracetamol 500mg": { current: 80, min: 500, unit: "tablets" }, // LOW STOCK ALERT
      "Amoxicillin 250mg": { current: 450, min: 200, unit: "tablets" },
      "ORS Packets": { current: 650, min: 100, unit: "sachets" },
      "Anti-Snake Venom": { current: 12, min: 10, unit: "vials" },
      "Insulin Glargine": { current: 5, min: 15, unit: "vials" } // LOW STOCK ALERT
    }
  },
  {
    id: "clinic-3",
    name: "Ormanjhi Sub-Health Centre",
    village: "Ormanjhi",
    lat: 23.4795,
    lng: 85.4812,
    stock: {
      "Paracetamol 500mg": { current: 1200, min: 300, unit: "tablets" },
      "Amoxicillin 250mg": { current: 320, min: 150, unit: "tablets" },
      "ORS Packets": { current: 50, min: 120, unit: "sachets" }, // LOW STOCK ALERT
      "Anti-Snake Venom": { current: 0, min: 5, unit: "vials" }, // OUT OF STOCK
      "Insulin Glargine": { current: 18, min: 10, unit: "vials" }
    }
  },
  {
    id: "clinic-4",
    name: "Bundu Regional Health Clinic",
    village: "Bundu",
    lat: 23.1812,
    lng: 85.5911,
    stock: {
      "Paracetamol 500mg": { current: 40, min: 600, unit: "tablets" }, // CRITICAL ALERT
      "Amoxicillin 250mg": { current: 15, min: 200, unit: "tablets" }, // CRITICAL ALERT
      "ORS Packets": { current: 800, min: 200, unit: "sachets" },
      "Anti-Snake Venom": { current: 15, min: 10, unit: "vials" },
      "Insulin Glargine": { current: 22, min: 15, unit: "vials" }
    }
  }
];

// Pre-seeded Emergency Trauma & Super Specialty Facilities (nearest emergency system database)
const emergencyFacilities: EmergencyFacility[] = [
  {
    id: "emer-1",
    name: "Rajendra Institute of Medical Sciences (RIMS) Trauma Center",
    type: "Tertiary Care & Trauma Hub",
    lat: 23.3855,
    lng: 85.3418,
    contact: "+91 651-2541533",
    bedsAvailable: 42,
    hasICU: true,
    hasAmbulance: true
  },
  {
    id: "emer-2",
    name: "Devendra Multispecialty Emergency Hospital",
    type: "District Emergency Hospital",
    lat: 23.3444,
    lng: 85.3096,
    contact: "+91 651-2480010",
    bedsAvailable: 15,
    hasICU: true,
    hasAmbulance: true
  },
  {
    id: "emer-3",
    name: "Purulia Government District Emergency Wing",
    type: "District General Hospital",
    lat: 23.3322,
    lng: 86.3655,
    contact: "+91 3252-222432",
    bedsAvailable: 28,
    hasICU: false,
    hasAmbulance: true
  },
  {
    id: "emer-4",
    name: "Mandar Rural Trust Trauma Hospital",
    type: "Emergency Primary Hospital",
    lat: 23.4560,
    lng: 85.0888,
    contact: "+91 651-2856411",
    bedsAvailable: 8,
    hasICU: false,
    hasAmbulance: false
  }
];

// Pre-seeded patient consultations
let consultations: Consultation[] = [
  {
    id: "consult-1",
    patientName: "Kamla Devi",
    age: 48,
    gender: "Female",
    village: "Silli Rural Sector B",
    symptoms: "Severe back pain radiating down to the left leg, continuous for 4 days. Unable to stand or walk for long periods to fetch water. Knee is also swollen.",
    timestamp: "2026-06-17T09:45:00.000Z",
    status: "Pending",
    reportName: "Kamla_Devi_XRay_Report.pdf"
  },
  {
    id: "consult-2",
    patientName: "Ramesh Mahto",
    age: 32,
    gender: "Male",
    village: "Ormanjhi Village Inner",
    symptoms: "High fever accompanied by severe chills for 3 days. Frequent headache and extreme muscle fatigue. Has a body rash since yesterday.",
    timestamp: "2026-06-16T14:20:00.000Z",
    status: "Prescribed",
    doctorNotes: "Symptoms are indicative of vector-borne fever. Keep patient hydrated. Please monitor temperature 4 times daily and report if fever crosses 104°F.",
    prescription: "Take Paracetamol 500mg twice a day after meals. Administer ORS fluid constantly. Review clinical blood test in 2 days.",
    prescribedMeds: [
      { name: "Paracetamol 500mg", qty: 10 },
      { name: "ORS Packets", qty: 5 }
    ],
    reportName: "Ramesh_BloodReport_CBC.png"
  },
  {
    id: "consult-3",
    patientName: "Gopal Birhor",
    age: 12,
    gender: "Male",
    village: "Tamar Outer Wilds",
    symptoms: "Acute watery diarrhoea and vomiting since morning. Child is dehydrated, sluggish, and has deep-set eyes.",
    timestamp: "2026-06-17T18:10:00.000Z",
    status: "Pending"
  }
];

// Pre-seeded medicine distributions
let distributions: Distribution[] = [
  {
    id: "dist-1",
    clinicId: "clinic-1",
    clinicName: "Silli Primary Health Centre",
    medicine: "Paracetamol 500mg",
    quantity: 1000,
    dispatchedAt: "2026-06-15T10:00:00.000Z",
    status: "Delivered"
  },
  {
    id: "dist-2",
    clinicId: "clinic-3",
    clinicName: "Ormanjhi Sub-Health Centre",
    medicine: "Anti-Snake Venom",
    quantity: 15,
    dispatchedAt: "2026-06-17T08:30:00.000Z",
    status: "In Transit"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Endpoint 1: Get list of clinics with alert logs
  app.get("/api/clinics", (req, res) => {
    res.json(clinics);
  });

  // API Endpoint 2: Add or modify clinic stock (Admin distribution)
  app.post("/api/clinics/stock", (req, res) => {
    const { clinicId, medicine, current, min, unit } = req.body;
    if (!clinicId || !medicine) {
      return res.status(400).json({ error: "Missing required fields clinicId or medicine." });
    }

    const clinic = clinics.find(c => c.id === clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found." });
    }

    if (!clinic.stock[medicine]) {
      clinic.stock[medicine] = { current: 0, min: min || 100, unit: unit || "tablets" };
    }

    if (current !== undefined) clinic.stock[medicine].current = current;
    if (min !== undefined) clinic.stock[medicine].min = min;
    if (unit !== undefined) clinic.stock[medicine].unit = unit;

    res.json({ message: "Stock updated successfully", clinic });
  });

  // API Endpoint 3: Complete consultations list
  app.get("/api/consultations", (req, res) => {
    res.json(consultations);
  });

  // API Endpoint 4: Get consultation by id
  app.get("/api/consultations/:id", (req, res) => {
    const consult = consultations.find(c => c.id === req.params.id);
    if (!consult) {
      return res.status(404).json({ error: "Consultation not found." });
    }
    res.json(consult);
  });

  // API Endpoint 5: Save/Upload a new consultation (Patient)
  app.post("/api/consultations", (req, res) => {
    const { patientName, age, gender, village, symptoms, reportName, reportDataUri } = req.body;
    
    if (!patientName || !age || !gender || !village || !symptoms) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const newConsultation: Consultation = {
      id: "consult-" + (consultations.length + 1) + "-" + Math.random().toString(36).substr(2, 4),
      patientName,
      age: parseInt(age),
      gender,
      village,
      symptoms,
      reportName,
      reportDataUri,
      timestamp: new Date().toISOString(),
      status: "Pending"
    };

    consultations.unshift(newConsultation);
    res.status(201).json(newConsultation);
  });

  // API Endpoint 6: Submit prescription (Doctor)
  app.post("/api/consultations/:id/prescription", (req, res) => {
    const { id } = req.params;
    const { doctorNotes, prescription, prescribedMeds } = req.body;

    const consult = consultations.find(c => c.id === id);
    if (!consult) {
      return res.status(404).json({ error: "Consultation not found." });
    }

    consult.doctorNotes = doctorNotes || "";
    consult.prescription = prescription || "";
    consult.prescribedMeds = prescribedMeds || [];
    consult.status = "Prescribed";

    // When doctor prescribes, deduct from closest/designated clinic's stock
    // Match the patient's village location to deduct stock appropriately
    const lowerVillage = consult.village.toLowerCase();
    let targetClinic = clinics.find(c => lowerVillage.includes(c.village.toLowerCase())) || clinics[0];

    // Deduct stock for each prescribed medicine, if existing in stock
    if (prescribedMeds && Array.isArray(prescribedMeds)) {
      prescribedMeds.forEach((item: { name: string; qty: number }) => {
        if (targetClinic && targetClinic.stock[item.name]) {
          const newQty = Math.max(0, targetClinic.stock[item.name].current - item.qty);
          targetClinic.stock[item.name].current = newQty;
        }
      });
    }

    res.json({ message: "Prescription recorded and clinic stock allocated", consultation: consult });
  });

  // API Endpoint 7: Medicine distribution log list (Admin)
  app.get("/api/distributions", (req, res) => {
    res.json(distributions);
  });

  // API Endpoint 8: Create new distribution (Admin)
  app.post("/api/distributions", (req, res) => {
    const { clinicId, medicine, quantity } = req.body;
    if (!clinicId || !medicine || !quantity) {
      return res.status(400).json({ error: "Missing physical distribution details." });
    }

    const clinic = clinics.find(c => c.id === clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found." });
    }

    const newDist: Distribution = {
      id: "dist-" + (distributions.length + 1),
      clinicId,
      clinicName: clinic.name,
      medicine,
      quantity: parseInt(quantity),
      dispatchedAt: new Date().toISOString(),
      status: "Dispatched"
    };

    distributions.unshift(newDist);

    // Increase clinic stock immediately for high fidelity
    if (clinic.stock[medicine]) {
      clinic.stock[medicine].current += parseInt(quantity);
    } else {
      clinic.stock[medicine] = {
        current: parseInt(quantity),
        min: 100,
        unit: "tablets"
      };
    }

    res.status(201).json(newDist);
  });

  // API Endpoint 9: Get emergency facilities list
  app.get("/api/emergency-facilities", (req, res) => {
    res.json(emergencyFacilities);
  });

  // API Endpoint 10: Trigger alert dispatcher (Simulate rapid stock warning or restock request)
  app.post("/api/clinics/:id/alert", (req, res) => {
    const clinic = clinics.find(c => c.id === req.params.id);
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });
    
    // Simulate low stock event trigger
    const medKey = Object.keys(clinic.stock)[0];
    if (medKey) {
      clinic.stock[medKey].current = Math.floor(clinic.stock[medKey].min / 2);
    }
    res.json({ message: "Simulated emergency depletion trigger successfully", clinic });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
