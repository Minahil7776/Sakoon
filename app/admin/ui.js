import Link from "next/link";
import { label } from "@/lib/format";

const TONE = {
  active: "ok", approved: "ok",
  pending: "warn", additional_info_required: "warn", suspended: "warn",
  rejected: "bad", deactivated: "bad",
  admin: "info", psychologist: "info", client: "neutral",
};

export const Badge = ({ value }) => <span className={`a-badge ${TONE[value] ?? "neutral"}`}>{label(value)}</span>;

export function Pagination({ page, total, pageSize, path, params = {} }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p) => {
    const q = new URLSearchParams({ ...params, page: String(p) });
    for (const [k, v] of [...q]) if (!v) q.delete(k);
    return `${path}?${q}`;
  };
  return (
    <div className="a-pager">
      <span>Page {page} of {pages} · {total} results</span>
      <div>
        {page > 1 && <Link className="a-btn" href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className="a-btn" href={href(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}

export const Empty = ({ children }) => <div className="a-empty">{children}</div>;

export const Avatar = ({ name }) => (
  <span className="a-avatar" aria-hidden="true">
    {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
  </span>
);
