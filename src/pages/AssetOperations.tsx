
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Users,
  Clock,
  Plus,
  Search,
  ClipboardCheck,
  Laptop,
  Wrench,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

import api from "../lib/api";
import { useAuth } from "../context/auth";

type Asset = {
  id: string;
  name?: string;
  asset_tag?: string;
  status: string;
  assignment_pending_to_id?: string | null;
};

type AssetRequest = {
  id: string;
  item_name?: string;
  status: string;
  created_at?: string;
};

type Category = {
  id: string;
  name: string;
};

function readArray<T>(response: any): T[] {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function Metric({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof Package;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 ${
        onClick
          ? "cursor-pointer transition hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-lg p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function AssetOperations() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role;
  const isManagement = role === "admin" || role === "superadmin";
  const isSuperadmin = role === "superadmin";

  const [inventory, setInventory] = useState<Asset[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isManagement) {
        const results = await Promise.allSettled([
          api.get("/assets"),
          api.get("/assets/requests"),
          api.get("/asset-categories/"),
        ]);

        const [assetsResult, requestsResult, categoriesResult] = results;
        const failures: string[] = [];

        if (assetsResult.status === "fulfilled") {
          setInventory(readArray<Asset>(assetsResult.value));
        } else {
          failures.push("company inventory");
          console.error("Failed to load company assets:", assetsResult.reason);
        }

        if (requestsResult.status === "fulfilled") {
          setRequests(readArray<AssetRequest>(requestsResult.value));
        } else {
          failures.push("company requests");
          console.error(
            "Failed to load company asset requests:",
            requestsResult.reason,
          );
        }

        if (categoriesResult.status === "fulfilled") {
          setCategories(readArray<Category>(categoriesResult.value));
        } else {
          failures.push("asset categories");
          console.error(
            "Failed to load asset categories:",
            categoriesResult.reason,
          );
        }

        if (failures.length > 0) {
          setError(
            `Could not load ${failures.join(", ")}. Check the failed API requests and your permissions.`,
          );
        }
      } else {
        const results = await Promise.allSettled([
          api.get("/assets/mine"),
          api.get("/assets/requests/mine"),
        ]);

        const [assetsResult, requestsResult] = results;
        const failures: string[] = [];

        if (assetsResult.status === "fulfilled") {
          setMyAssets(readArray<Asset>(assetsResult.value));
        } else {
          failures.push("your assigned assets");
          console.error("Failed to load my assets:", assetsResult.reason);
        }

        if (requestsResult.status === "fulfilled") {
          setRequests(readArray<AssetRequest>(requestsResult.value));
        } else {
          failures.push("your asset requests");
          console.error(
            "Failed to load my asset requests:",
            requestsResult.reason,
          );
        }

        if (failures.length > 0) {
          setError(
            `Could not load ${failures.join(" and ")}. Check the failed API requests.`,
          );
        }
      }
    } catch (err) {
      console.error("Unexpected error loading asset operations:", err);
      setError("Could not load asset information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isManagement]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const assets = isManagement ? inventory : myAssets;

  const count = (status: string) =>
    assets.filter(
      (asset) => asset.status?.toLowerCase() === status.toLowerCase(),
    ).length;

  const pendingRequests = requests.filter((request) =>
    ["pending", "submitted", "under_review"].includes(
      request.status?.toLowerCase(),
    ),
  );

  const pendingAssignments = assets.filter(
    (asset) =>
      Boolean(asset.assignment_pending_to_id) ||
      asset.status?.toLowerCase() === "pending_assignment",
  );

  const maintenance = assets.filter((asset) =>
    ["maintenance", "under_maintenance", "under_repair"].includes(
      asset.status?.toLowerCase(),
    ),
  );

  // The destination pages must read these query parameters to filter
  // their displayed data.
  const openPendingRequests = () => {
    navigate(
      isManagement
        ? "/assets/requests?status=pending"
        : "/assets/requests/mine?status=pending",
    );
  };

  const openPendingAssignments = () => {
    navigate("/assets/assignments?status=pending_assignment");
  };

  const openMaintenance = () => {
    navigate("/assets?status=maintenance");
  };

  const recentRequests = [...requests]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Manage Assets
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              {isManagement
                ? "Monitor company inventory, requests and assignments."
                : "Keep track of your equipment and asset requests."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle size={19} className="shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              <p className="mt-1 text-xs text-amber-800">
                Some sections may still be available.
              </p>
            </div>
          </div>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {isManagement ? "Company Overview" : "My Asset Overview"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current status at a glance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isManagement ? (
              <>
                <Metric
                  title="Total Inventory"
                  value={loading ? "—" : inventory.length}
                  subtitle="Registered assets"
                  icon={Package}
                  color="bg-blue-50 text-blue-700"
                  onClick={() => navigate("/assets")}
                />
                <Metric
                  title="Available Assets"
                  value={loading ? "—" : count("available")}
                  subtitle="Ready for allocation"
                  icon={CheckCircle2}
                  color="bg-emerald-50 text-emerald-700"
                  onClick={() => navigate("/assets?status=available")}
                />
                <Metric
                  title="Assigned Assets"
                  value={loading ? "—" : count("assigned")}
                  subtitle="Currently with employees"
                  icon={Users}
                  color="bg-indigo-50 text-indigo-700"
                  onClick={() => navigate("/assets?status=assigned")}
                />
                <Metric
                  title="Pending Requests"
                  value={loading ? "—" : pendingRequests.length}
                  subtitle="Awaiting review"
                  icon={Clock}
                  color="bg-amber-50 text-amber-700"
                  onClick={openPendingRequests}
                />
              </>
            ) : (
              <>
                <Metric
                  title="My Assigned Assets"
                  value={loading ? "—" : count("assigned")}
                  subtitle="Equipment assigned to you"
                  icon={Laptop}
                  color="bg-blue-50 text-blue-700"
                  onClick={() => navigate("/assets/mine")}
                />
                <Metric
                  title="My Requests"
                  value={loading ? "—" : requests.length}
                  subtitle="Total submitted requests"
                  icon={Package}
                  color="bg-indigo-50 text-indigo-700"
                  onClick={() => navigate("/assets/requests/mine")}
                />
                <Metric
                  title="Pending Requests"
                  value={loading ? "—" : pendingRequests.length}
                  subtitle="Awaiting review"
                  icon={Clock}
                  color="bg-amber-50 text-amber-700"
                  onClick={openPendingRequests}
                />
                <Metric
                  title="Pending Invitations"
                  value={loading ? "—" : pendingAssignments.length}
                  subtitle="Awaiting your acceptance"
                  icon={ClipboardCheck}
                  color="bg-emerald-50 text-emerald-700"
                  onClick={openPendingAssignments}
                />
              </>
            )}
          </div>
        </section>

        {isManagement && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Inventory Status
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Distribution across asset statuses
                  </p>
                </div>
                <Package size={21} className="text-slate-400" />
              </div>

              {[
                {
                  label: "Available",
                  value: count("available"),
                  color: "bg-emerald-500",
                  action: () => navigate("/assets?status=available"),
                },
                {
                  label: "Assigned",
                  value: count("assigned"),
                  color: "bg-blue-500",
                  action: () => navigate("/assets?status=assigned"),
                },
                {
                  label: "Pending assignment",
                  value: pendingAssignments.length,
                  color: "bg-violet-500",
                  // action: openPendingAssignments,
                },
                {
                  label: "Maintenance",
                  value: maintenance.length,
                  color: "bg-amber-500",
                  action: openMaintenance,
                },
                {
                  label: "Retired",
                  value: count("retired"),
                  color: "bg-slate-400",
                  action: () => navigate("/assets?status=retired"),
                },
              ].map((item) => {
                const total = inventory.length;
                const percentage =
                  total > 0 ? (item.value / total) * 100 : 0;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="mb-4 block w-full text-left last:mb-0"
                  >
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">
                        {loading ? "—" : item.value}
                        {!loading && total > 0 &&
                          ` · ${Math.round(percentage)}%`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Attention Required
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Items that may need action
                  </p>
                </div>
                <AlertCircle size={21} className="text-slate-400" />
              </div>

              <button
                type="button"
                onClick={openPendingRequests}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                    <ClipboardCheck size={19} />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-800">
                      Pending requests
                    </span>
                    <span className="text-sm text-slate-500">
                      Requests awaiting review
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-slate-900">
                  {loading ? "—" : pendingRequests.length}
                  <ArrowRight size={16} className="ml-2 inline" />
                </span>
              </button>

              <button
                type="button"
                onClick={openPendingAssignments}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-violet-50 p-2 text-violet-700">
                    <Users size={19} />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-800">
                      Pending assignments
                    </span>
                    <span className="text-sm text-slate-500">
                      Awaiting employee acceptance
                    </span>
                  </span>
                </span>
                
              </button>

              <button
                type="button"
                onClick={openMaintenance}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-orange-50 p-2 text-orange-700">
                    <Wrench size={19} />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-800">
                      Maintenance
                    </span>
                    <span className="text-sm text-slate-500">
                      Assets under maintenance
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-slate-900">
                  {loading ? "—" : maintenance.length}
                  <ArrowRight size={16} className="ml-2 inline" />
                </span>
              </button>

              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => navigate("/assets/categories")}
                  className="flex w-full items-center justify-between border-t border-slate-100 pt-4 text-left text-sm text-slate-600 hover:text-red-700"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen size={18} />
                    {categories.length} asset categories
                  </span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                {isManagement ? "Recent Requests" : "My Recent Requests"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest asset requests and their current status.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  isManagement
                    ? "/assets/requests"
                    : "/assets/requests/mine",
                )
              }
              className="shrink-0 text-sm font-medium text-red-700 hover:text-red-800"
            >
              View all
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading requests…
            </p>
          ) : recentRequests.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList
                size={30}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-medium text-slate-700">
                No requests to display
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Requests will appear here when they are submitted.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {request.item_name || "Asset request"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.created_at
                        ? new Date(request.created_at).toLocaleDateString()
                        : "Date unavailable"}
                    </p>
                  </div>
                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                      request.status === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : request.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {request.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Frequently used operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => navigate("/assets/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
              >
                <Plus size={17} />
                Add Asset
              </button>
            )}

            {isManagement && (
              <button
                type="button"
                onClick={() => navigate("/assets")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Search size={17} />
                View Inventory
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/assets/mine")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Laptop size={17} />
              My Assets
            </button>

            <button
              type="button"
              onClick={() => navigate("/assets/request")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList size={17} />
              Request Asset
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
