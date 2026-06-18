import { useState, useEffect } from "react";
import { MapPin, Phone, Hospital, ShieldAlert, Navigation, Truck, RefreshCw, Layers } from "lucide-react";
import { EmergencyFacility } from "../types";

// Ranchi coordinate reference bounds
// latitude around 23.0 to 23.6, longitude around 85.0 to 86.4
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Simulated Villagers and Reference Coordinates
export const MOUNT_VILLAGES = [
  { name: "Silli Sector B", lat: 23.3524, lng: 85.8153, desc: "East Rural Ranchi" },
  { name: "Tamar Outer Foothills", lat: 23.0489, lng: 85.6418, desc: "South Border Rural" },
  { name: "Ormanjhi Village Center", lat: 23.4795, lng: 85.4812, desc: "North Highway Belt" },
  { name: "Bundu Forests Area", lat: 23.1812, lng: 85.5911, desc: "Southeast Rural Hills" },
  { name: "Ranchi Center (Capital)", lat: 23.3441, lng: 85.3096, desc: "Central City Zone" }
];

interface EmergencyLocatorProps {
  facilities: EmergencyFacility[];
}

export default function EmergencyLocator({ facilities }: EmergencyLocatorProps) {
  const [userLat, setUserLat] = useState<number>(23.3524); // Defaults to Silli
  const [userLng, setUserLng] = useState<number>(85.8153);
  const [locationName, setLocationName] = useState<string>("Silli Sector B");
  const [filterICU, setFilterICU] = useState<boolean>(false);
  const [filterAmbulance, setFilterAmbulance] = useState<boolean>(false);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [dialingId, setDialingId] = useState<string | null>(null);

  // Auto-fetch browser location on start if permitted
  const fetchBrowserLocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation support is not enabled in this browser.");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
        setLocationName("Your Current Live Location");
        setGeoLoading(false);
      },
      (error) => {
        console.warn("Geolocation warning:", error);
        setGeoError(
          error.code === 1
            ? "Permission denied. Select a simulated village profile below."
            : "Could not retrieve live coordinates. Using pre-set village profiles instead."
        );
        setGeoLoading(false);
      },
      { timeout: 7000 }
    );
  };

  const handleVillageSelect = (v: typeof MOUNT_VILLAGES[0]) => {
    setUserLat(v.lat);
    setUserLng(v.lng);
    setLocationName(v.name);
    setGeoError(null);
  };

  // Process facilities list, calculate distances, and sort
  const facilitiesWithDistance = facilities
    .map((f) => ({
      ...f,
      distance: calculateDistance(userLat, userLng, f.lat, f.lng)
    }))
    .filter((f) => {
      if (filterICU && !f.hasICU) return false;
      if (filterAmbulance && !f.hasAmbulance) return false;
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  const nearestFacility = facilitiesWithDistance[0];

  const triggerEmergencyDial = (f: EmergencyFacility) => {
    setDialingId(f.id);
    setTimeout(() => {
      setDialingId(null);
    }, 4000);
  };

  // Dimensions for custom visual Ranchi district map SVG coordinates conversion
  // Map lat/lng coordinates to standard SVG viewport width=600 height=340
  // रांची latitude extends roughly 23.0 to 23.55, longitude 85.0 to 86.5
  const mapCoordinates = (lat: number, lng: number) => {
    const minLat = 22.95;
    const maxLat = 23.58;
    const minLng = 84.95;
    const maxLng = 86.45;

    // x relates to longitude, y relates to latitude (y-axis inverted in SVG)
    const x = ((lng - minLng) / (maxLng - minLng)) * 580 + 10;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 320 + 10;
    return { x, y };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="emergency-locator-root">
      {/* Geolocation selector & Emergency Hub List */}
      <div className="lg:col-span-5 flex flex-col space-y-4" id="emergency-left-panel">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" id="location-configuration">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-500" />
              Patient Geolocation System
            </h3>
            <button
              onClick={fetchBrowserLocation}
              disabled={geoLoading}
              className="text-xs bg-rose-50 border border-rose-100 hover:bg-rose-100 active:bg-rose-200 text-rose-600 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${geoLoading ? "animate-spin" : ""}`} />
              Get Live GPS
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/70 mb-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Active Patient Location</p>
            <div className="flex items-center justify-between mt-1">
              <span className="font-semibold text-slate-800 text-sm">{locationName}</span>
              <span className="text-xs font-mono text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                {userLat.toFixed(4)}°N, {userLng.toFixed(4)}°E
              </span>
            </div>
            {geoError && (
              <p className="text-[11px] text-amber-600 bg-amber-50 rounded-md p-1.5 mt-2 border border-amber-100 font-sans leading-normal">
                {geoError}
              </p>
            )}
          </div>

          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simulate Rural Villages</h4>
          <div className="grid grid-cols-2 gap-2" id="simulated-villages-grid">
            {MOUNT_VILLAGES.map((v) => (
              <button
                key={v.name}
                onClick={() => handleVillageSelect(v)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all relative ${
                  locationName === v.name
                    ? "bg-rose-50/50 border-rose-200 ring-1 ring-rose-300"
                    : "bg-white hover:bg-slate-50 border-slate-100"
                }`}
              >
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>{v.name.split(" ")[0]}</span>
                  {locationName === v.name && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 mt-1 leading-none">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Facility Cards Sorted Near to Far */}
        <div className="flex items-center justify-between" id="filter-header">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Nearest Emergency Trauma Hubs ({facilitiesWithDistance.length})
          </span>
          <div className="flex gap-2 text-[11px]">
            <label className="flex items-center gap-1 text-slate-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={filterICU}
                onChange={() => setFilterICU(!filterICU)}
                className="rounded text-rose-500 focus:ring-rose-400 h-3 w-3"
              />
              Needs ICU
            </label>
            <label className="flex items-center gap-1 text-slate-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={filterAmbulance}
                onChange={() => setFilterAmbulance(!filterAmbulance)}
                className="rounded text-rose-500 focus:ring-rose-400 h-3 w-3"
              />
              With Ambulance
            </label>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1" id="emergency-hubs-list">
          {facilitiesWithDistance.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
              No trauma center matches selected filter conditions within this district.
            </div>
          ) : (
            facilitiesWithDistance.map((f, idx) => {
              const isNearest = idx === 0;
              const isDialing = dialingId === f.id;
              
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all relative ${
                    isNearest
                      ? "bg-rose-50/20 border-rose-100 ring-1 ring-rose-200"
                      : "bg-white hover:border-slate-200 border-slate-100"
                  }`}
                  id={`facility-${f.id}`}
                >
                  {isNearest && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                      Nearest Option
                    </span>
                  )}
                  
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isNearest ? "bg-rose-100/60 text-rose-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Hospital className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm pr-16">{f.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{f.type}</p>

                      <div className="flex items-center gap-3 mt-2.5 font-mono text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                          <Navigation className="h-3 w-3 text-slate-400 shrink-0" />
                          {f.distance} km away
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold ${
                            f.bedsAvailable > 15
                              ? "bg-emerald-50 text-emerald-700"
                              : f.bedsAvailable > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {f.bedsAvailable} Beds Available
                        </span>
                      </div>

                      {/* ICU, Ambulance, contact facilities indicators */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {f.hasICU ? (
                          <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1 font-medium">
                            <ShieldAlert className="h-2.5 w-2.5 text-rose-400 shrink-0" />
                            ICU Ward Active
                          </span>
                        ) : null}
                        {f.hasAmbulance ? (
                          <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1 font-medium">
                            <Truck className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                            Emergency Ambulance dispatch
                          </span>
                        ) : null}
                      </div>

                      {/* Direct action Dial button */}
                      <button
                        onClick={() => triggerEmergencyDial(f)}
                        className={`mt-3 w-full text-xs font-semibold py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 relative overflow-hidden ${
                          isDialing
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-white hover:bg-slate-50 text-rose-600 border-rose-100 active:bg-rose-50"
                        }`}
                      >
                        {isDialing ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Connecting Ambulance Dispatcher...
                          </>
                        ) : (
                          <>
                            <Phone className="h-3.5 w-3.5" />
                            Contact Dispatch ({f.contact})
                          </>
                        )}
                        {isDialing && (
                          <div className="absolute inset-0 bg-rose-500 opacity-20 animate-ping pointer-events-none" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive Geo-Map Panel */}
      <div className="lg:col-span-7 flex flex-col space-y-3" id="emergency-right-panel">
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col flex-1 relative min-h-[440px] shadow-lg overflow-hidden">
          {/* Header info */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0 z-10">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-bold">
                Dynamic Ranchi District Spatial Grid
              </span>
              <h3 className="text-base font-semibold font-sans tracking-tight flex items-center gap-2 text-white mt-0.5">
                <Layers className="h-4 w-4 text-emerald-400" />
                Live Geolocation Tracking Canvas
              </h3>
            </div>
            <div className="text-right text-xs">
              <p className="text-white/60 font-mono text-[10px] leading-tight">Map Scale</p>
              <p className="font-semibold text-white/90">1 : 450,000</p>
            </div>
          </div>

          {/* Interactive Ranchi map canvas */}
          <div className="relative flex-1 bg-slate-950/80 rounded-xl border border-white/5 flex items-center justify-center p-2 relative">
            <svg
              className="w-full h-full max-h-[340px] filter drop-shadow-md select-none"
              viewBox="0 0 600 340"
              xmlns="http://www.w3.org/2000/svg"
              id="ranchi-map-canvas"
            >
              {/* Background geographical bounds simulation wrapper */}
              <rect x="0" y="0" width="600" height="340" rx="8" fill="#0b0f19" opacity="0.3" />
              
              {/* Grid Lines for technical geospatial backdrop */}
              <g stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 8" opacity="0.1">
                <line x1="100" y1="0" x2="100" y2="340" />
                <line x1="200" y1="0" x2="200" y2="340" />
                <line x1="300" y1="0" x2="300" y2="340" />
                <line x1="400" y1="0" x2="400" y2="340" />
                <line x1="500" y1="0" x2="500" y2="340" />
                <line x1="0" y1="60" x2="600" y2="60" />
                <line x1="0" y1="120" x2="600" y2="120" />
                <line x1="0" y1="180" x2="600" y2="180" />
                <line x1="0" y1="240" x2="600" y2="240" />
                <line x1="0" y1="300" x2="600" y2="300" />
              </g>

              {/* Ranchi District Boundary simulation */}
              <path
                d="M 200,40 L 410,30 L 590,140 L 560,280 L 320,320 L 70,250 L 50,110 Z"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />

              {/* Connection vector line (Patient to facilities to visualize distance constraints) */}
              {nearestFacility && (
                <>
                  {facilitiesWithDistance.map((f, i) => {
                    const patientPt = mapCoordinates(userLat, userLng);
                    const facilityPt = mapCoordinates(f.lat, f.lng);
                    const isFirst = i === 0;
                    return (
                      <line
                        key={`link-${f.id}`}
                        x1={patientPt.x}
                        y1={patientPt.y}
                        x2={facilityPt.x}
                        y2={facilityPt.y}
                        stroke={isFirst ? "#ef4444" : "#475569"}
                        strokeWidth={isFirst ? "1.8" : "0.7"}
                        strokeDasharray={isFirst ? "none" : "2 4"}
                        opacity={isFirst ? "0.8" : "0.3"}
                      />
                    );
                  })}
                </>
              )}

              {/* Render Emergency Facilities on Map */}
              {facilities.map((f) => {
                const pt = mapCoordinates(f.lat, f.lng);
                const isNearest = nearestFacility && nearestFacility.id === f.id;
                
                return (
                  <g key={`map-fac-${f.id}`} className="cursor-pointer group">
                    {/* Ring wrapper for animated beacon effect */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isNearest ? "14" : "9"}
                      fill={isNearest ? "#ef4444" : "#3b82f6"}
                      opacity="0.15"
                      className="animate-ping"
                      style={{ animationDuration: isNearest ? "2.5s" : "4s" }}
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isNearest ? "6.5" : "4.5"}
                      fill={isNearest ? "#ef4444" : "#3b82f6"}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 11}
                      textAnchor="middle"
                      fill="#f1f5f9"
                      fontSize="9"
                      fontWeight={isNearest ? "bold" : "normal"}
                      className="font-sans antialiased select-none pointer-events-none"
                    >
                      {f.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}

              {/* Render other pre-seeded rural villages indicators for overview */}
              {MOUNT_VILLAGES.map((v) => {
                const pt = mapCoordinates(v.lat, v.lng);
                const isActive = locationName === v.name || (locationName === "Your Current Live Location" && Math.abs(userLat - v.lat) < 0.05);
                
                return (
                  <g key={`map-vill-${v.name}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={isActive ? "#10b981" : "#475569"}
                      opacity={isActive ? "0.9" : "0.6"}
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 12}
                      textAnchor="middle"
                      fill={isActive ? "#34d399" : "#94a3b8"}
                      fontSize="8"
                      className="font-mono antialiased"
                    >
                      {v.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}

              {/* Render Active Patient Pointer */}
              {userLat && userLng && (() => {
                const pt = mapCoordinates(userLat, userLng);
                return (
                  <g>
                    <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 3" className="animate-spin" style={{ animationDuration: '12s' }} />
                    <circle cx={pt.x} cy={pt.y} r="24" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
                    <path d={`M ${pt.x} ${pt.y - 12} L ${pt.x - 7} ${pt.y - 4} L ${pt.x + 7} ${pt.y - 4} Z`} fill="#10b981" />
                    <circle cx={pt.x} cy={pt.y} r="3" fill="#ffffff" />
                    <text x={pt.x} y={pt.y - 18} textAnchor="middle" fill="#10b981" fontSize="9.5" fontWeight="bold">PATIENT</text>
                  </g>
                );
              })()}
            </svg>

            {/* Map Legend (Bottom Overlay) */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md rounded-lg p-2 border border-white/10 flex items-center justify-between text-[10px] text-white/80 shrink-0 font-mono">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Trauma center (Nearest)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Specialized Hospital
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Rural Clinic / Selected
                </span>
              </div>
              <p className="text-[9px] text-slate-500">Updates in real-time based on GPS position</p>
            </div>
          </div>

          {/* Quick-reference emergency recommendations */}
          {nearestFacility && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex gap-2.5 items-start">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Nearest Specialized Triage Routing Recommendation</p>
                <p className="text-white/70 text-[11px] mt-0.5 leading-normal">
                  Based on geographic distance, transport to <strong className="text-white">{nearestFacility.name}</strong>, located approximately <strong className="text-rose-300 font-mono">{nearestFacility.distance} km</strong> away. This facility currently lists <strong className="text-white">{nearestFacility.bedsAvailable} available bed spaces</strong> and {nearestFacility.hasICU ? "has supportive intensive care (ICU)" : "does not standardly guarantee immediate ICU support"}. Call them first!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
