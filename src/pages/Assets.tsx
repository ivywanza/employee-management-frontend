
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ClipboardList,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../context/auth";
import api from "../lib/api";

type Mode = "view" | "mine" | "request" | "manage";
type AssetStatus =
  | "available"
  | "assigned"
  | "maintenance"
  | "retired";

type Asset = {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  description: string | null;
  serial_number: string | null;
  status: AssetStatus;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  is_active: boolean;
};

type AssetRequest = {
  id: string;
  requested_by_id: string;
  asset_id: string | null;
  item_name: string;
  category: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  requester_name: string | null;
  asset_name: string | null;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const assetStatuses: AssetStatus[] = [
  "available",
  "assigned",
  "maintenance",
  "retired",
];

const titles: Record<Mode, string> = {
  view: "View assets",
  mine: "My assigned assets",
  request: "Request an asset",
  manage: "Manage assets",
};

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "available" || status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "pending" || status === "maintenance"
        ? "bg-amber-100 text-amber-800"
        : status === "rejected" || status === "retired"
          ? "bg-slate-200 text-slate-700"
          : "bg-blue-100 text-blue-800";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export default function AssetsPage({ mode }: { mode: Mode }) {
  const { user } = useAuth();
  const canView = ["admin", "superadmin"].includes(user?.role ?? "");
  const canManage = user?.role === "superadmin";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("pending");

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("IT equipment");
  const [purpose, setPurpose] = useState("");
  const [requestedAssetId, setRequestedAssetId] = useState("");

  const [newTag, setNewTag] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("IT equipment");
  const [newSerial, setNewSerial] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (mode === "mine") {
        const response = await api.get<Asset[]>("/assets/mine");
        setAssets(response.data);
        setRequests([]);
      } else if (mode === "request") {
        const [availableResponse, requestsResponse] = await Promise.all([
          api.get<Asset[]>("/assets", {
            params: { status: "available" },
          }).catch(() => ({ data: [] as Asset[] })),
          api.get<AssetRequest[]>("/assets/requests/mine"),
        ]);

        setAssets(availableResponse.data);
        setRequests(requestsResponse.data);
      } else {
        if (!canView) {
          setAssets([]);
          setRequests([]);
          setError("You do not have permission to view the asset register.");
          return;
        }

        const assetResponse = await api.get<Asset[]>("/assets");
        setAssets(assetResponse.data);

        if (mode === "manage") {
          const requestResponse = await api.get<AssetRequest[]>(
            "/assets/requests",
            { params: requestStatus ? { status: requestStatus } : {} },
          );
          setRequests(requestResponse.data);
        } else {
          setRequests([]);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not load asset information.",
      );
    } finally {
      setLoading(false);
    }
  }, [mode, canView, requestStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.post("/assets/requests", {
        item_name: itemName.trim(),
        category: category.trim(),
        purpose: purpose.trim(),
        ...(requestedAssetId ? { asset_id: requestedAssetId } : {}),
      });

      setItemName("");
      setPurpose("");
      setRequestedAssetId("");
      setNotice("Asset request submitted.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not submit the asset request.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.post("/assets", {
        asset_tag: newTag.trim(),
        name: newName.trim(),
        category: newCategory.trim(),
        serial_number: newSerial.trim() || null,
        description: newDescription.trim() || null,
        status: "available",
      });

      setNewTag("");
      setNewName("");
      setNewSerial("");
      setNewDescription("");
      setNotice("Asset added to the register.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Could not create the asset.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateAssetStatus(
    asset: Asset,
    status: AssetStatus,
  ) {
    setError("");
    setNotice("");

    try {
      await api.patch(`/assets/${asset.id}`, { status });
      setNotice("Asset status updated.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Could not update asset status.",
      );
    }
  }

  async function assignAsset(asset: Asset) {
    const employeeId = window.prompt(
      "Enter the UUID of the employee to assign this asset to. Leave blank to unassign.",
      asset.assigned_to_id ?? "",
    );

    if (employeeId === null) return;

    setError("");
    setNotice("");

    try {
      await api.patch(`/assets/${asset.id}`, {
        assigned_to_id: employeeId.trim() || null,
      });
      setNotice("Asset assignment updated.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not update asset assignment.",
      );
    }
  }

  async function reviewRequest(
    item: AssetRequest,
    status: "approved" | "rejected",
  ) {
    let selectedAssetId = item.asset_id;

    if (status === "approved" && !selectedAssetId) {
      const available = assets.filter(
        (asset) => asset.status === "available",
      );

      if (!available.length) {
        setError("There are no available assets to assign.");
        return;
      }

      const choices = available
        .map((asset) => `${asset.asset_tag}: ${asset.name} — ${asset.id}`)
        .join("\n");

      selectedAssetId = window.prompt(
        `Enter the UUID of an available asset:\n${choices}`,
      );

      if (!selectedAssetId) return;
    }

    const reviewNote = window.prompt(
      status === "approved"
        ? "Optional approval note:"
        : "Reason for rejection:",
    );

    if (reviewNote === null) return;

    setError("");
    setNotice("");

    try {
      await api.patch(`/assets/requests/${item.id}`, {
        status,
        review_note: reviewNote,
        ...(selectedAssetId ? { asset_id: selectedAssetId } : {}),
      });

      setNotice(`Request ${status}.`);
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not review this request.",
      );
    }
  }

  const filteredAssets = assets.filter((asset) =>
    [
      asset.name,
      asset.asset_tag,
      asset.category,
      asset.serial_number ?? "",
      asset.assigned_to_name ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const availableAssets = assets.filter(
    (asset) => asset.status === "available" && asset.is_active,
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 py-2 sm:py-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Inventory
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {titles[mode]}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "mine"
                ? "Equipment assigned to your account."
                : mode === "request"
                  ? "Submit a request and track its status."
                  : mode === "manage"
                    ? "Maintain inventory and review employee requests."
                    : "Search the organisation's active asset register."}
            </p>
          </div>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {notice}
        </p>
      )}

      {mode === "request" && (
        <form
          onSubmit={submitRequest}
          className={`${cardClass} space-y-4`}
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardList className="h-5 w-5 text-red-600" />
            New asset request
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Item requested
              <input
                className={inputClass}
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                required
                minLength={2}
                maxLength={160}
                placeholder="e.g. Laptop"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Category
              <input
                className={inputClass}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                maxLength={100}
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm font-medium">
            Purpose
            <textarea
              className={inputClass}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              required
              minLength={10}
              maxLength={3000}
              rows={4}
              placeholder="Explain what you need it for."
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Specific available asset (optional)
            <select
              className={inputClass}
              value={requestedAssetId}
              onChange={(event) =>
                setRequestedAssetId(event.target.value)
              }
            >
              <option value="">Request an item without selecting an asset</option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_tag} — {asset.name}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}

      {(mode === "view" || mode === "mine" || mode === "manage") && (
        <>
          <div
            className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, tag, category…"
              />
            </div>
            <span className="text-sm text-slate-500">
              {filteredAssets.length} assets
            </span>
          </div>

          {mode === "manage" && canManage && (
            <form
              onSubmit={createAsset}
              className={`${cardClass} space-y-4`}
            >
              <h2 className="flex items-center gap-2 font-semibold">
                <Plus className="h-5 w-5 text-red-600" />
                Add an asset
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1.5 text-sm font-medium">
                  Asset tag
                  <input
                    className={inputClass}
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    required
                    placeholder="RA-IT-001"
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium">
                  Asset name
                  <input
                    className={inputClass}
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    required
                    placeholder="Lenovo laptop"
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium">
                  Category
                  <input
                    className={inputClass}
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(event.target.value)
                    }
                    required
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium">
                  Serial number
                  <input
                    className={inputClass}
                    value={newSerial}
                    onChange={(event) => setNewSerial(event.target.value)}
                  />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm font-medium">
                Description
                <textarea
                  className={inputClass}
                  value={newDescription}
                  onChange={(event) =>
                    setNewDescription(event.target.value)
                  }
                  rows={2}
                />
              </label>

              <button
                disabled={saving}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save asset"}
              </button>
            </form>
          )}

          {loading ? (
            <div
              className={`${cardClass} flex items-center justify-center gap-2 py-12 text-sm text-slate-500`}
            >
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading assets…
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className={`${cardClass} py-12 text-center`}>
              <Package className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-semibold">No assets found</h2>
              <p className="mt-1 text-sm text-slate-500">
                There are no assets matching this view.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <article key={asset.id} className={cardClass}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {asset.asset_tag}
                      </p>
                      <h2 className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {asset.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {asset.category}
                      </p>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>

                  {asset.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {asset.description}
                    </p>
                  )}

                  <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Serial</dt>
                      <dd className="break-all text-right">
                        {asset.serial_number || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Assigned to</dt>
                      <dd className="text-right">
                        {asset.assigned_to_name || "Unassigned"}
                      </dd>
                    </div>
                  </dl>

                  {mode === "manage" && canManage && (
                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <label className="block space-y-1 text-xs font-semibold">
                        Update status
                        <select
                          className={inputClass}
                          value={asset.status}
                          onChange={(event) =>
                            void updateAssetStatus(
                              asset,
                              event.target.value as AssetStatus,
                            )
                          }
                        >
                          {assetStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => void assignAsset(asset)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700"
                      >
                        Assign / change assignee
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "manage" && canManage && (
        <section className={`${cardClass} space-y-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Asset requests
            </h2>
            <select
              className={`${inputClass} sm:max-w-48`}
              value={requestStatus}
              onChange={(event) => setRequestStatus(event.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All statuses</option>
            </select>
          </div>

          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">
              No requests found for this status.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.item_name}</h3>
                      <p className="text-sm text-slate-500">
                        {item.category} · Requested by{" "}
                        {item.requester_name || "Employee"}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {item.purpose}
                  </p>

                  {item.review_note && (
                    <p className="mt-2 text-sm text-slate-500">
                      Review note: {item.review_note}
                    </p>
                  )}

                  {item.status === "pending" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          void reviewRequest(item, "approved")
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Approve & assign
                      </button>
                      <button
                        onClick={() =>
                          void reviewRequest(item, "rejected")
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {mode === "request" && (
        <section className={`${cardClass} space-y-3`}>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            My asset requests
          </h2>

          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">
              You have not submitted any requests.
            </p>
          ) : (
            requests.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.item_name}</p>
                    <p className="text-sm text-slate-500">
                      {item.category} ·{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <p className="mt-2 text-sm">{item.purpose}</p>

                {item.review_note && (
                  <p className="mt-2 text-sm text-slate-500">
                    Review note: {item.review_note}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
      )}
    </section>
  );
}
