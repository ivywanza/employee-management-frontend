import api from "../lib/api"; // ADAPT

export type PaymentMethod = "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque";
export type RequisitionStatus = "pending" | "approved" | "rejected";

export const PAYMENT_METHODS: PaymentMethod[] = ["M-Pesa", "Bank Transfer", "Cash", "Cheque"];

export interface Requisition {
  id: number;
  number: string;
  name: string;
  email: string;
  contact_number: string;
  department: string;
  purpose: string;
  payment_method: PaymentMethod;
  account_number: string | null;
  amount: number;
  status: RequisitionStatus;
  reviewed_by: string | null;
  reviewed_on: string | null;
  created_at: string;
}

export interface RequisitionInput {
  name: string;
  email: string;
  contact_number: string;
  department: string;
  purpose: string;
  payment_method: PaymentMethod;
  account_number: string | null;
  amount: number;
}

export interface RequisitionSummary {
  pending: number;
  approved: number;
  rejected: number;
  approved_total: number;
  by_month: { month: string; total: number }[];
}

// Pydantic serialises Decimal as a string, so normalise it once, here.
const normalise = (r: any): Requisition => ({ ...r, amount: Number(r.amount) });

export const kes = (n: number | string) =>
  `KES ${Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const createRequisition = (payload: RequisitionInput) =>
  api.post("/requisitions", payload).then((r) => normalise(r.data));

export const listMyRequisitions = () =>
  api.get("/requisitions/mine").then((r) => (r.data as any[]).map(normalise));

export const listRequisitions = (status?: RequisitionStatus) =>
  api.get("/requisitions", { params: { status } }).then((r) => (r.data as any[]).map(normalise));

export const getRequisitionSummary = () =>
  api.get<RequisitionSummary>("/requisitions/summary").then((r) => r.data);

export const reviewRequisition = (id: number, status: "approved" | "rejected") =>
  api.patch(`/requisitions/${id}/review`, { status }).then((r) => normalise(r.data));