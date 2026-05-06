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
  coverageApplied?: number;
  rainfallMm?: number;
  rainfall7d?: number;
  tempAvg?: number;
  floodRisk?: number;
  droughtRisk?: number;
  prediction?: string;
  damagePercent?: number;
  estimatedClaim?: number;
  policySummary?: {
    sumInsured: number;
    coverageUsed: number;
  };
  explanation?: string;
  warning?: string;
  agentRemark?: string;
}

/**
 * Robust mapper that converts snake_case backend fields to camelCase frontend fields.
 */
export const mapClaim = (data: any): Claim => {
  if (!data) return data;
  return {
    ...data,
    // Standard Mappings
    aiDamageScore:   data.aiDamageScore   || data.ai_damage_score,
    aiConfidence:    data.aiConfidence    || data.ai_confidence || data.confidence,
    aiReasoning:     data.aiReasoning     || data.ai_reasoning || data.explanation,
    
    // Payout & Damage Mappings
    estimatedPayout: data.estimatedPayout || data.estimated_payout || data.estimatedClaim || data.estimated_claim,
    estimatedClaim:  data.estimatedClaim  || data.estimated_claim  || data.estimatedPayout || data.estimated_payout,
    damagePercent:   data.damagePercent   || data.damage_percent   || data.aiDamageScore   || data.ai_damage_score,
    
    // Insurance Details — also check nested policy_summary for coverage
    coverageApplied: data.coverageApplied || data.coverage_applied 
                     || data.policy_summary?.coverage_used 
                     || data.policySummary?.coverageUsed,
    totalSumInsured: data.totalSumInsured || data.total_sum_insured
                     || data.policy_summary?.sum_insured
                     || data.policySummary?.sumInsured,
    
    // Risk & Weather Details
    floodRisk:       data.floodRisk       || data.flood_risk,
    droughtRisk:     data.droughtRisk     || data.drought_risk,
    rainfallMm:      data.rainfallMm      || data.rainfall_mm || data.rainfall_current,
    rainfall7d:      data.rainfall7d      || data.rainfall_7d,
    tempAvg:         data.tempAvg         || data.temp_avg,
    
    // Nested Summary Handling
    policySummary:   data.policySummary || (data.policy_summary ? {
      sumInsured:    data.policy_summary.sum_insured || data.policy_summary.sumInsured,
      coverageUsed:  data.policy_summary.coverage_used || data.policy_summary.coverageUsed || data.coverage_applied,
    } : undefined),
    
    // Agent Remarks
    agentRemark:     data.agentRemark     || data.agent_remark,
  };
};

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
