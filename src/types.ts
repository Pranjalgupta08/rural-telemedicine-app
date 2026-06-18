export interface Clinic {
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
    };
  };
}

export interface Consultation {
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

export interface Distribution {
  id: string;
  clinicId: string;
  clinicName: string;
  medicine: string;
  quantity: number;
  dispatchedAt: string;
  status: "Dispatched" | "In Transit" | "Delivered";
}

export interface EmergencyFacility {
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

export interface AlertLog {
  id: string;
  clinicId: string;
  clinicName: string;
  medicineName: string;
  currentStock: number;
  minThreshold: number;
  severity: "low" | "critical";
  timestamp: string;
}
