import { api } from './api';
import axios from 'axios';

const aiApiBase = axios.create({
  baseURL: import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8001',
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password?: string) => api.post('/auth/login', { email, password }),
  sendOtp: (email: string, purpose: string) => api.post('/auth/send-otp', { email, purpose }),
  verify: (email: string, otp: string, purpose: string) => api.post('/auth/verify-email', { email, otp, purpose }),
  register: (payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    aadhaarNumber: string;
    state: string;
    district: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  }) => api.post('/auth/register', { ...payload, role: 'FARMER' }),
};

// ─── Farms ───────────────────────────────────────────────────────────────────
export interface Farm {
  id?: number;
  farmerId?: number;
  farmName: string;
  state: string;
  district: string;
  village: string;
  taluka?: string;
  pincode?: string;
  surveyNumber?: string;
  primaryCrop?: string;
  areaAcres?: number;
  soilType?: string;
  irrigationType?: string;
  boundaryGeoJson?: string;
  latitude?: number;
  longitude?: number;
}

export const farmApi = {
  getAll: (farmerId: number) =>
    api.get<Farm[]>('/farmer/farms', { params: { farmerId } }),
  getById: (id: number)   => api.get<Farm>(`/farmer/farms/${id}`),
  create: (farm: Farm)    => api.post<Farm>('/farmer/farms', farm),
  update: (id: number, farm: Farm) => api.put<Farm>(`/farmer/farms/${id}`, farm),
};

// ─── Claims ──────────────────────────────────────────────────────────────────
export interface Claim {
  id?: number;
  farmerId?: number;
  farmId?: number;
  calamityType: string;
  status?: string;
  aiDamageScore?: number;
  aiConfidence?: number;
  aiReasoning?: string;
  deltaNdvi?: number;
  deltaNdwi?: number;
  deltaSar?: number;
  floodProbability?: number;
  droughtProbability?: number;
  dateOfLoss?: string;
  visualFloodScore?: number;
  visualDroughtScore?: number;
  sumInsuredPerAcre?: number;
  totalSumInsured?: number;
  farmAreaSnapshot?: number;
  estimatedPayout?: number;
  coverageApplied?: number; // Added
  rainfallMm?: number;
  rainfall7d?: number;
  tempAvg?: number;
  floodRisk?: number;
  droughtRisk?: number;
  prediction?: string;
  damagePercent?: number; // Renamed from damage_percent
  estimatedClaim?: number; // Renamed from estimated_claim
  policySummary?: { // Renamed from policy_summary
    sumInsured: number;
    coverageUsed: number;
  };
  explanation?: string;
  warning?: string;
}

export const mapClaim = (data: any): Claim => ({
  ...data,
  aiDamageScore:   data.aiDamageScore || data.ai_damage_score,
  aiConfidence:    data.aiConfidence || data.confidence || data.ai_confidence,
  estimatedPayout: data.estimatedPayout || data.estimated_payout,
  estimatedClaim:  data.estimatedClaim || data.estimated_claim,
  damagePercent:   data.damagePercent || data.damage_percent,
  coverageApplied: data.coverageApplied || data.coverage_applied,
  policySummary:   data.policySummary || data.policy_summary ? {
    sumInsured:    data.policySummary?.sumInsured || data.policy_summary?.sum_insured,
    coverageUsed:  data.policySummary?.coverageUsed || data.policy_summary?.coverage_used,
  } : undefined
});

export const claimApi = {
  getAll: (farmerId: number) =>
    api.get<Claim[]>('/farmer/claims', { params: { farmerId } })
      .then(res => ({ ...res, data: res.data.map(mapClaim) })),
  file: (claim: Claim)   => api.post<Claim>('/farmer/claims/file', claim)
      .then(res => ({ ...res, data: mapClaim(res.data) })),
  delete: (id: number, farmerId: number) =>
    api.delete(`/farmer/claims/${id}`, { params: { farmerId } }),
};

// ─── Agent ───────────────────────────────────────────────────────────────────
export const agentApi = {
  getAllClaims: () => api.get<Claim[]>('/agent/claims'),
  getById: (id: string) => api.get<Claim>(`/agent/claims/${id}`),
  updateStatus: (id: string, status: string, agentNotes: string) =>
    api.put(`/agent/claims/${id}/status`, { status, agentNotes }),
};

// ─── AI Engine ───────────────────────────────────────────────────────────────
export const aiApi = {
  predict: (formData: FormData) => aiApiBase.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
