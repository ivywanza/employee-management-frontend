import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, MessageSquareWarning } from "lucide-react";

interface Props {
  /** true for superadmin, admin, or anyone in the HR department */
  canManage: boolean;
  /** true when the sidebar is collapsed to icons only */
  collapsed?: boolean;
}

const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
const link = ({ isActive }: { isActive: boolean }) =>
  `${base} ${isActive ? "bg-white/15 font-semibold text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`;

export default function SidebarGrievancesMenu({ canManage, collapsed = false }: Props) {
  const { pathname } = useLocation();
  const onGrievances = pathname.startsWith("/grievances");
  const [open, setOpen] = useState(onGrievances);

  // Employees: one plain link
  if (!canManage) {
    return (
      <NavLink to="/grievances/submit" className={link} title="Grievances">
        <MessageSquareWarning size={18} className="shrink-0" />
        {!collapsed && <span>Grievances</span>}
      </NavLink>
    );
  }

  // Collapsed sidebar: icon only, goes to the manage page
  if (collapsed) {
    return (
      <NavLink to="/grievances/manage" className={link} title="Grievances">
        <MessageSquareWarning size={18} className="shrink-0" />
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="grievances-submenu"
        className={`${base} w-full justify-between ${
          onGrievances ? "text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          <MessageSquareWarning size={18} className="shrink-0" />
          Grievances
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id="grievances-submenu" className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-3">
          <NavLink to="/grievances/view" className={link}>View grievances</NavLink>
          <NavLink to="/grievances/manage" className={link}>Manage grievances</NavLink>
          <NavLink to="/grievances/submit" className={link}>Send a grievance</NavLink>
        </div>
      )}
    </div>
  );
}