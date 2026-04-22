import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

type AuditAction =
  | 'CREATE_PATIENT'
  | 'CREATE_CLINICIAN'
  | 'UPDATE_CLINICIAN_STATUS'
  | 'DELETE_CLINICIAN'
  | 'UPDATE_THRESHOLDS'
  | 'ACKNOWLEDGE_ALERT'
  | 'ESCALATE_ALERT'
  | 'EXPORT_DATA'
  | 'VIEW_PATIENT'
  | string;

interface LogAuditParams {
  db: Firestore;
  action: AuditAction;
  actorId?: string | null;
  actorRole?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

export async function logAudit({
  db,
  action,
  actorId,
  actorRole,
  targetId,
  metadata = {},
}: LogAuditParams) {
  try {
    await addDoc(collection(db, 'audit_logs'), omitUndefined({
      action,
      actorId: actorId ?? null,
      actorRole: actorRole ?? null,
      targetId: targetId ?? null,
      metadata,
      timestamp: serverTimestamp(),
    }));
  } catch (error) {
    console.error('Audit log failed', error);
  }
}
