import type { Role } from "../context/auth";

export interface NavigationContext {
  role: Role | null;
  isHr: boolean;
}

export interface NavigationItem {
  label: string;
  to: string;
  enabled: boolean;
  visible: (ctx: NavigationContext) => boolean;
}

export interface NavigationSection {
  label?: string;
  items: NavigationItem[];
}

const everyone = () => true;
const admin = (ctx: NavigationContext) => ctx.role === "admin" || ctx.role === "superadmin";
const superadmin = (ctx: NavigationContext) => ctx.role === "superadmin";
const hrOrSuperadmin = (ctx: NavigationContext) => ctx.isHr || superadmin(ctx);

export const navigationSections: NavigationSection[] = [
  {
    items: [
      { label: "Home", to: "/", enabled: true, visible: everyone },
      { label: "Messages", to: "/messages", enabled: true, visible: everyone },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Tasks", to: "/tasks", enabled: false, visible: everyone },
      { label: "Timesheet", to: "/timesheet", enabled: false, visible: everyone },
      { label: "Insights", to: "/insights", enabled: false, visible: everyone },
    ],
  },
  {
    label: "Requests",
    items: [
      { label: "Apply for Leave", to: "/leave", enabled: true, visible: everyone },
      { label: "Requisitions", to: "/requisitions", enabled: false, visible: everyone },
      { label: "Grievances", to: "/grievances", enabled: false, visible: everyone },
    ],
  },
  {
    label: "Documents",
    items: [
      { label: "Document Hub", to: "/documents", enabled: true, visible: everyone },
      { label: "Onboarding Documents", to: "/onboarding", enabled: true, visible: everyone },
      { label: "My Submissions", to: "/my-submissions", enabled: true, visible: everyone },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "My Assets", to: "/assets/mine", enabled: false, visible: everyone },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Add Employee", to: "/add-associate", enabled: true, visible: admin },
      { label: "Employee List", to: "/associates", enabled: true, visible: admin },
      { label: "Manage Documents", to: "/manage-documents", enabled: true, visible: admin },
      { label: "Assets", to: "/assets", enabled: false, visible: admin },
      { label: "Expense Overview", to: "/expenses", enabled: false, visible: admin },
    ],
  },
  {
    label: "Admin or HR",
    items: [
      { label: "Departments", to: "/departments", enabled: false, visible: hrOrSuperadmin },
    ],
  },
  {
    label: "Review",
    items: [
      { label: "Review Leave", to: "/review-leave", enabled: true, visible: hrOrSuperadmin },
      { label: "Review Onboarding", to: "/review-onboarding", enabled: true, visible: hrOrSuperadmin },
      { label: "Requisition Approvals", to: "/requisitions/approvals", enabled: false, visible: admin },
      { label: "Timesheet Approvals", to: "/timesheets/approvals", enabled: false, visible: admin },
      { label: "Grievance Inbox", to: "/grievances/inbox", enabled: false, visible: superadmin },
    ],
  },
];

export function getVisibleNavigation(ctx: NavigationContext): NavigationSection[] {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.enabled && item.visible(ctx)),
    }))
    .filter((section) => section.items.length > 0);
}
