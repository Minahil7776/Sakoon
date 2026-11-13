"use client";
import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { setUserStatus } from "../actions";

const COPY = {
  suspended: { label: "Suspend", title: "Suspend this account?", body: "They won’t be able to sign in until you reactivate them.", tone: "warn", note: true },
  deactivated: { label: "Deactivate", title: "Deactivate this account?", body: "The account is closed. You can reactivate it later if needed.", tone: "danger", note: true },
  active: { label: "Reactivate", title: "Reactivate this account?", body: "They’ll be able to sign in again.", tone: "primary" },
};

export default function UserActions({ userId, name, status }) {
  const [target, setTarget] = useState(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const c = target && COPY[target];

  const close = () => { setTarget(null); setError(""); };
  const confirm = (reason) =>
    start(async () => {
      const res = await setUserStatus({ userId, status: target, reason });
      if (res.ok) close(); else setError(res.error);
    });

  return (
    <>
      <div className="a-row-actions">
        {Object.keys(COPY).filter((s) => s !== status).map((s) => (
          <button key={s} className="a-btn sm" onClick={() => { setError(""); setTarget(s); }}>{COPY[s].label}</button>
        ))}
      </div>
      <ConfirmDialog
        open={!!target}
        title={c ? `${c.title.replace("this account", name)}` : ""}
        body={c?.body}
        confirmLabel={c?.label}
        tone={c?.tone}
        noteLabel={c?.note ? "Reason (kept in the audit log)" : undefined}
        pending={pending}
        error={error}
        onConfirm={confirm}
        onClose={close}
      />
    </>
  );
}
