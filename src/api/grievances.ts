import api from "../lib/api"; // ADAPT: your axios instance (baseURL + auth header)

export type GrievanceCategory = "work" | "site" | "other";
export type GrievanceStatus = "new" | "in_review" | "resolved";

export interface Grievance {
  id: number;
  category: GrievanceCategory;
  subject: string;
  message: string;
  superadmin_only: boolean;
  status: GrievanceStatus;
  internal_notes: string | null;
  response: string | null;
  created_on: string;
  updated_on: string;
}

export interface TrackResult {
  category: GrievanceCategory;
  subject: string;
  status: GrievanceStatus;
  response: string | null;
  created_on: string;
  updated_on: string;
}

export interface GrievanceStats {
  total: number;
  new: number;
  in_review: number;
  resolved: number;
}

export const CATEGORY_LABEL: Record<GrievanceCategory, string> = {
  work: "About work",
  site: "About this site",
  other: "Something else",
};

export const STATUS_LABEL: Record<GrievanceStatus, string> = {
  new: "New",
  in_review: "In review",
  resolved: "Resolved",
};

export const errorMessage = (err: any, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.detail && typeof err.response.data.detail === "string"
    ? err.response.data.detail
    : fallback;

export const submitGrievance = (payload: {
  category: GrievanceCategory;
  subject: string;
  message: string;
  superadmin_only: boolean;
}) => api.post<{ tracking_code: string }>("/grievances", payload).then((r) => r.data);

export const trackGrievance = (code: string) =>
  api.get<TrackResult>(`/grievances/track/${encodeURIComponent(code.trim())}`).then((r) => r.data);

export const listGrievances = (params: { category?: string; status?: string; q?: string }) =>
  api.get<Grievance[]>("/grievances", { params }).then((r) => r.data);

export const getGrievanceStats = () => api.get<GrievanceStats>("/grievances/stats").then((r) => r.data);

export const updateGrievance = (
  id: number,
  patch: Partial<Pick<Grievance, "status" | "internal_notes" | "response">>
) => api.patch<Grievance>(`/grievances/${id}`, patch).then((r) => r.data);