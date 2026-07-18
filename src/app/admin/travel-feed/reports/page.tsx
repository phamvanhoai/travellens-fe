"use client";

import axios from "axios";
import { Eye, Flag, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  adminTravelFeedService,
  getAdminTravelFeedReporter,
  getAdminTravelFeedReportId,
  getAdminTravelFeedReportPost,
  getAdminTravelFeedReportPostId,
  getTravelFeedContent,
  getTravelFeedTitle,
  type AdminTravelFeedReport,
  type AdminTravelFeedReportListParams,
  type AdminTravelFeedReportStatus,
  type TravelFeedReportReason
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

const pageSize = 20;

export default function AdminTravelFeedReportsPage() {
  const [reports, setReports] = useState<AdminTravelFeedReport[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [includeDeletedPosts, setIncludeDeletedPosts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(0);
  const [deleting, setDeleting] = useState<AdminTravelFeedReport | null>(null);
  const [error, setError] = useState("");
  const showToast = useToast();

  const params = useMemo<AdminTravelFeedReportListParams>(() => ({
    page,
    limit: pageSize,
    search: query || undefined,
    status: status ? status as AdminTravelFeedReportStatus : undefined,
    reason: reason ? reason as TravelFeedReportReason : undefined,
    include_deleted_posts: includeDeletedPosts,
    sort
  }), [includeDeletedPosts, page, query, reason, sort, status]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminTravelFeedService.listReports(params);
      setReports(result.items);
      setTotalItems(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      const message = getApiError(err, "Cannot load travel feed reports from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [params, showToast]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  async function dismissReport(report: AdminTravelFeedReport) {
    const reportId = getAdminTravelFeedReportId(report);
    if (!reportId) return;
    setSavingId(reportId);
    try {
      await adminTravelFeedService.dismissReport(reportId);
      showToast({ variant: "success", title: "Report dismissed", description: `Report #${reportId} was marked as invalid.` });
      await loadReports();
    } catch (err) {
      const message = getApiError(err, "Cannot review this report.");
      setError(message);
      showToast({ variant: "error", title: "Update failed", description: message });
    } finally {
      setSavingId(0);
    }
  }

  async function deleteViolatedPost() {
    if (!deleting) return;
    const reportId = getAdminTravelFeedReportId(deleting);
    if (!reportId) return;
    setSavingId(reportId);
    try {
      await adminTravelFeedService.deleteViolatedPost(reportId);
      showToast({ variant: "success", title: "Violated post deleted", description: "The post was soft-deleted and its pending reports were resolved." });
      setDeleting(null);
      await loadReports();
    } catch (err) {
      const message = getApiError(err, "Cannot delete the violated post.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSavingId(0);
    }
  }

  async function restorePost(report: AdminTravelFeedReport) {
    const reportId = getAdminTravelFeedReportId(report);
    const postId = getAdminTravelFeedReportPostId(report);
    if (!reportId || !postId) return;
    setSavingId(reportId);
    setError("");
    try {
      await adminTravelFeedService.restorePost(postId);
      showToast({ variant: "success", title: "Post restored", description: `Post #${postId} was restored to its previous status.` });
      await loadReports();
    } catch (err) {
      const message = getApiError(err, "Cannot restore this post.");
      setError(message);
      showToast({ variant: "error", title: "Restore failed", description: message });
    } finally {
      setSavingId(0);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Flag className="text-rose-600" /> Travel Feed Reports</h1><p className="mt-1 text-sm text-slate-500">Review reports and remove posts that violate community rules.</p></div>
          <Button variant="outline" onClick={() => void loadReports()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 flex gap-3" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()); setPage(1); }}>
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search reports, posts, or reporters..." /></div>
          <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
        </form>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_220px_160px_auto]">
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All statuses</option><option value="pending">Pending</option><option value="dismissed">Dismissed</option><option value="resolved">Resolved</option></select>
          <select value={reason} onChange={(event) => { setReason(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All reasons</option><option value="spam">Spam</option><option value="inappropriate_content">Inappropriate content</option><option value="harassment">Harassment</option><option value="false_information">False information</option><option value="scam">Scam</option><option value="other">Other</option></select>
          <select value={sort} onChange={(event) => { setSort(event.target.value as "newest" | "oldest"); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option></select>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={includeDeletedPosts} onChange={(event) => { setIncludeDeletedPosts(event.target.checked); setPage(1); }} /> Include deleted posts</label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Reported post", "Reporter", "Reason", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead>
            <tbody>{loading ? <AdminTableSkeleton columns={7} rows={10} /> : reports.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">No reports found.</td></tr> : reports.map((report, index) => <ReportRow key={getAdminTravelFeedReportId(report) || index} report={report} saving={savingId === getAdminTravelFeedReportId(report)} onDismiss={() => void dismissReport(report)} onDelete={() => setDeleting(report)} onRestore={() => void restorePost(report)} />)}</tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="reports" onPageChange={setPage} />
      </div>

      {deleting ? <ConfirmDialog title="Delete violated post?" message={`Soft-delete post #${getAdminTravelFeedReportPostId(deleting)} and resolve all pending reports for it?`} confirmLabel={savingId ? "Deleting..." : "Delete violated post"} onCancel={() => { if (!savingId) setDeleting(null); }} onConfirm={() => void deleteViolatedPost()} /> : null}
    </>
  );
}

function ReportRow({ report, saving, onDismiss, onDelete, onRestore }: { report: AdminTravelFeedReport; saving: boolean; onDismiss: () => void; onDelete: () => void; onRestore: () => void }) {
  const id = getAdminTravelFeedReportId(report);
  const post = getAdminTravelFeedReportPost(report);
  const postId = getAdminTravelFeedReportPostId(report);
  const deleted = post?.status === "deleted" || Boolean(post?.deleted_at);
  return <tr className="border-t border-slate-100 align-top">
    <td className="p-3 font-bold">#{id || "-"}</td>
    <td className="max-w-sm p-3"><p className="line-clamp-1 font-bold text-ink">{post ? getTravelFeedTitle(post) : `Post #${postId || "-"}`}</p><p className="mt-1 line-clamp-2 text-slate-500">{post ? getTravelFeedContent(post) : "Post details unavailable"}</p>{deleted ? <span className="mt-2 inline-block rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">Deleted</span> : null}</td>
    <td className="p-3 font-semibold text-slate-700">{getAdminTravelFeedReporter(report)}</td>
    <td className="max-w-xs p-3"><p className="font-semibold capitalize text-slate-700">{String(report.reason ?? "-").replaceAll("_", " ")}</p>{report.description ? <p className="mt-1 line-clamp-2 text-slate-500">{report.description}</p> : null}</td>
    <td className="p-3"><StatusBadge value={report.status ?? "pending"} /></td>
    <td className="p-3 text-slate-600">{report.created_at ? formatDate(report.created_at) : "-"}</td>
    <td className="p-3"><div className="flex items-center gap-2">{postId ? <a href={`/admin/travel-feed/${postId}`} title="View report post" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600"><Eye size={16} /></a> : null}{report.status === "pending" ? <button type="button" onClick={onDismiss} disabled={saving} title="Dismiss invalid report" className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40">Dismiss</button> : <span className="text-xs font-semibold text-slate-400">Processed</span>}{deleted ? <button type="button" onClick={onRestore} disabled={saving || !postId} title="Restore post" className="grid size-9 place-items-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><RotateCcw size={16} /></button> : report.status === "pending" ? <button type="button" onClick={onDelete} disabled={saving} title="Delete violated post" className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16} /></button> : null}</div></td>
  </tr>;
}

function StatusBadge({ value }: { value: string }) {
  const colors = value === "pending" ? "bg-amber-50 text-amber-700" : value === "resolved" ? "bg-emerald-50 text-emerald-700" : value === "dismissed" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${colors}`}><ShieldCheck size={13} />{value}</span>;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
