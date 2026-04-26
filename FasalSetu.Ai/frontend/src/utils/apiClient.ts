import { api } from './api';

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
  rainfallMm?: number;
  rainfall7d?: number;
  tempAvg?: number;
  floodRisk?: number;
  droughtRisk?: number;
}

export const claimApi = {
  getAll: (farmerId: number) =>
    api.get<Claim[]>('/farmer/claims', { params: { farmerId } }),
  file: (claim: Claim)   => api.post<Claim>('/farmer/claims/file', claim),
};

// ─── Agent ───────────────────────────────────────────────────────────────────
export const agentApi = {
  getAllClaims: () => api.get<Claim[]>('/agent/claims'),
  getById: (id: string) => api.get<Claim>(`/agent/claims/${id}`),
  updateStatus: (id: string, status: string, agentNotes: string) =>
    api.put(`/agent/claims/${id}/status`, { status, agentNotes }),
};
