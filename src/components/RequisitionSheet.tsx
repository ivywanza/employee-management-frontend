import { useState, type CSSProperties, type ReactNode } from "react";
import "../styles/requisition-print.css";
import { kes, type Requisition } from "../api/requisitions";

/** Everything is optional: pass nothing to get a blank form to fill in by hand. */
export interface SheetData {
  number?: string;
  date?: string;
  name?: string;
  contact?: string;
  email?: string;
  department?: string;
  purpose?: string;
  paymentMethod?: string;
  accountNumber?: string;
  amount?: string;
  requesterName?: string;
  authorizedBy?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const requisitionToSheet = (r: Requisition): SheetData => ({
  number: r.number,
  date: new Date(r.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }),
  name: r.name,
  contact: r.contact_number,
  email: r.email,
  department: r.department,
  purpose: r.purpose,
  paymentMethod: r.payment_method,
  accountNumber: r.account_number ?? "",
  amount: kes(r.amount),
  requesterName: r.name,
  authorizedBy: r.status === "approved" ? r.reviewed_by ?? "" : "",
});

function Field({ label, value, grow = 1, style }: { label: string; value?: string; grow?: number; style?: CSSProperties }) {
  return (
    <div
      className="req-field"
      style={{ flexGrow: grow, flexShrink: 1, flexBasis: grow ? 0 : "auto", ...style }}
    >
      <span className="req-label">{label}</span>
      <span className="req-line">{value}</span>
    </div>
  );
}

function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="req-logo-fallback">
        <strong>RAi</strong>
        <span>red ant international</span>
      </div>
    );
  }
  // Put the real logo at /public/rai-logo.png
  return <img className="req-logo" src="/rai-logo.png" alt="RAi, red ant international" onError={() => setFailed(true)} />;
}

function Copy({ d }: { d: SheetData }): ReactNode {
  return (
    <div className="req-copy">
      <div className="req-head">
        <h2 className="req-title">REQUISITION FORM</h2>
        <Logo />
      </div>

      <div className="req-row" style={{ justifyContent: "space-between" }}>
        <Field label="Requisition Number:" value={d.number} grow={0} style={{ flexBasis: "62mm" }} />
        <Field label="Date:" value={d.date} grow={0} style={{ flexBasis: "62mm" }} />
      </div>

      <h3 className="req-section">Requester Information:</h3>

      <div className="req-row">
        <Field label="Name:" value={d.name} grow={1.3} />
        <Field label="Contact Number:" value={d.contact} grow={1} />
      </div>
      <div className="req-row">
        <Field label="Email:" value={d.email} grow={1.3} />
        <Field label="Department/Team:" value={d.department} grow={1} />
      </div>

      <h3 className="req-section">Purpose of Funds:</h3>

      <div className="req-purpose">
        <span className="req-label">Purpose/Description:</span>
        <div className="req-ruled">{d.purpose}</div>
      </div>

      <h3 className="req-section">Payment Details:</h3>

      <div className="req-row">
        <Field label="Payment Method:" value={d.paymentMethod} grow={1} />
        <Field label="Account Number (if applicable):" value={d.accountNumber} grow={1.2} />
      </div>
      <div className="req-row">
        <Field label="Amount Requested:" value={d.amount} grow={0} style={{ flexBasis: "62%" }} />
      </div>

      <div className="req-approval">
        <div className="req-approval-col">
          <div className="req-bullet">Approval</div>
          <Field label="Requester’s Name:" value={d.requesterName} />
          <Field label="Signature:" />
        </div>
        <div className="req-approval-col">
          <div className="req-bullet">I hereby consent and authorize the disbursement;</div>
          <Field label="Authorized by:" value={d.authorizedBy} />
          <Field label="Signature:" />
        </div>
      </div>
    </div>
  );
}

export default function RequisitionSheet({ data = {} }: { data?: SheetData }) {
  return (
    <div className="req-sheet">
      <Copy d={data} />
      <div className="req-cut" aria-hidden="true">
        <span>✂</span>
      </div>
      <Copy d={data} />
    </div>
  );
}