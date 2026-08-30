import { EyeOff, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  cx,
  ownerColor,
  PRIORITY_LEVELS,
  PRIORITY_META,
} from "../lib/constants.js";
import { devId } from "../lib/devIdOverlay.js";
import { useDialog } from "../lib/useDialog.js";

// Compact P1/P2/P3/None row, same semantics as the CardMenu priority group
// (clicking the active level clears it) but sized for a dense table cell.
function PriorityCell({ repo, onSetPriority }) {
  return (
    <div
      className="flex gap-1"
      role="group"
      aria-label={`Set triage priority for ${repo.name}`}
    >
      {PRIORITY_LEVELS.map((level) => {
        const active = repo.priority === level;
        const meta = PRIORITY_META[level];
        return (
          <button
            key={level}
            aria-pressed={active}
            title={meta.title}
            onClick={() => onSetPriority(repo.id, active ? null : level)}
            className={cx(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              active
                ? meta.chip
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700",
            )}
          >
            {meta.label}
          </button>
        );
      })}
      <button
        aria-pressed={repo.priority == null}
        title="No priority"
        onClick={() => onSetPriority(repo.id, null)}
        className={cx(
          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
          repo.priority == null
            ? "bg-neutral-700 text-neutral-100"
            : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700",
        )}
      >
        None
      </button>
    </div>
  );
}

// Read/edit table for quickly triaging important repos: filter by
// organisation/name/description, then flip ignore + priority inline without
// opening the per-repo CardMenu. Reachable from the toolbar settings-cog
// button; closing it returns to whatever board/list view was underneath.
export function RepoAdminDialog({
  repos,
  onSetPriority,
  onSetIgnored,
  onClose,
}) {
  const dialogRef = useDialog(onClose);
  const [orgFilter, setOrgFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [hideIgnored, setHideIgnored] = useState(true);

  const orgs = useMemo(
    () => Array.from(new Set(repos.map((r) => r.owner).filter(Boolean))).sort(),
    [repos],
  );

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const desc = descFilter.trim().toLowerCase();
    return repos
      .filter((r) => !orgFilter || r.owner === orgFilter)
      .filter((r) => !name || r.name.toLowerCase().includes(name))
      .filter(
        (r) => !desc || (r.description || "").toLowerCase().includes(desc),
      )
      .filter((r) => !hideIgnored || !r.ignored)
      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
  }, [repos, orgFilter, nameFilter, descFilter, hideIgnored]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-30 bg-neutral-950/80" onClick={onClose} />
      <section
        {...devId("RepoAdminDialog")}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-admin-title"
        tabIndex={-1}
        className="fixed inset-2 z-40 flex flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 sm:inset-4"
      >
        <header className="flex items-start justify-between gap-3 border-b border-neutral-800 px-4 py-3">
          <div className="min-w-0">
            <h2
              id="repo-admin-title"
              className="text-sm font-semibold text-neutral-100"
            >
              Quick edit
            </h2>
            <p className="truncate text-[11px] text-neutral-500">
              {filtered.length} of {repos.length} repo
              {repos.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close quick edit"
            className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 px-4 py-2">
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            aria-label="Filter by organisation"
            className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-hidden focus:border-neutral-500"
          >
            <option value="">All organisations</option>
            {orgs.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
          <input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            list="repo-admin-name-options"
            placeholder="filter by repo name..."
            aria-label="Filter by repo name"
            className="min-w-[160px] flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-hidden focus:border-neutral-500"
          />
          <datalist id="repo-admin-name-options">
            {repos.map((r) => (
              <option key={r.id} value={r.name} />
            ))}
          </datalist>
          <input
            value={descFilter}
            onChange={(e) => setDescFilter(e.target.value)}
            list="repo-admin-desc-options"
            placeholder="filter by description..."
            aria-label="Filter by description"
            className="min-w-[160px] flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-hidden focus:border-neutral-500"
          />
          <datalist id="repo-admin-desc-options">
            {repos
              .filter((r) => r.description)
              .map((r) => (
                <option key={r.id} value={r.description} />
              ))}
          </datalist>
          <button
            onClick={() => setHideIgnored((v) => !v)}
            aria-pressed={hideIgnored}
            className={cx(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]",
              hideIgnored
                ? "border-neutral-600 bg-neutral-800 text-neutral-100"
                : "border-neutral-800 text-neutral-500 hover:text-neutral-300",
            )}
          >
            <EyeOff className="h-3 w-3" aria-hidden="true" />
            hide ignored
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-700">
              no repositories match
            </p>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-neutral-900">
                <tr className="border-b border-neutral-800 text-neutral-500">
                  <th className="px-2 py-1.5 font-medium">Organisation</th>
                  <th className="px-2 py-1.5 font-medium">Repo</th>
                  <th className="px-2 py-1.5 font-medium">Description</th>
                  <th className="px-2 py-1.5 font-medium">Ignored</th>
                  <th className="px-2 py-1.5 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((repo) => (
                  <tr
                    key={repo.id}
                    className="border-b border-neutral-800/60 align-top hover:bg-neutral-950/50"
                  >
                    <td className="px-2 py-2 text-neutral-400">
                      {repo.owner && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: ownerColor(repo.owner) }}
                            aria-hidden="true"
                          />
                          {repo.owner}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-neutral-100 hover:text-white hover:underline"
                      >
                        {repo.name}
                      </a>
                    </td>
                    <td className="max-w-md whitespace-pre-wrap break-words px-2 py-2 text-neutral-400">
                      {repo.description || "—"}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => onSetIgnored(repo.id, !repo.ignored)}
                        aria-pressed={repo.ignored}
                        className={cx(
                          "rounded-md px-2 py-0.5 text-[10px] font-medium",
                          repo.ignored
                            ? "bg-neutral-700 text-neutral-100"
                            : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700",
                        )}
                      >
                        {repo.ignored ? "Ignored" : "Active"}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <PriorityCell repo={repo} onSetPriority={onSetPriority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>,
    document.body,
  );
}
