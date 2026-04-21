import { api } from './api';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password?: string) => api.post('/auth/login', { email, password }),
  sendOtp: (email: string, purpose: string) => api.post('/auth/send-otp', { email, purpose }),
  verify: (email: string, otp: string, purpose: string) => api.post('/auth/verify-email', { email, otp, purpose }),
  register: (fullName: string, email: string, password?: string) =>
    api.post('/auth/register', { fullName, email, password, role: 'FARMER' }),
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
  areaHectares?: number;
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
}

export const claimApi = {
  getAll: (farmerId: number) =>
    api.get<Claim[]>('/farmer/claims', { params: { farmerId } }),
  file: (claim: Claim)   => api.post<Claim>('/farmer/claims/file', claim),
};

// ─── Agent ───────────────────────────────────────────────────────────────────
export const agentApi = {
  getAllClaims: () => api.get<Claim[]>('/agent/claims'),
  getAiReport:  (id: string) => api.get(`/agent/claims/${id}/ai-report`),
  approve: (id: string, agentNotes: string) =>
    api.post(`/agent/claims/${id}/approve`, { agentNotes }),
  reject: (id: string, agentNotes: string) =>
    api.post(`/agent/claims/${id}/reject`, { agentNotes }),
};
