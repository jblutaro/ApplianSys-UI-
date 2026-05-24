import type { Request } from "express";
import type { ResultSetHeader } from "mysql2";
import { readSession } from "../../auth/session.js";
import { dbPool } from "../../config/database.js";

type AuditEventInput = {
  action: string;
  actorId?: number | null;
  details?: Record<string, unknown>;
  entityId?: number | string | null;
  entityType: string;
  req?: Request;
};

let auditSchemaReady = false;

async function ensureAuditSchema() {
  if (auditSchemaReady) return;

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS audit_event (
      audit_event_id INT AUTO_INCREMENT PRIMARY KEY,
      actor_user_id INT NULL,
      action VARCHAR(120) NOT NULL,
      entity_type VARCHAR(120) NOT NULL,
      entity_id VARCHAR(120) NULL,
      details_json JSON NULL,
      ip_address VARCHAR(80) NULL,
      user_agent VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_event_actor (actor_user_id),
      INDEX idx_audit_event_entity (entity_type, entity_id),
      INDEX idx_audit_event_created_at (created_at)
    )
  `);

  auditSchemaReady = true;
}

function getRequestIp(req: Request | undefined) {
  if (!req) return null;

  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (forwardedIp?.split(",")[0] || req.ip || req.socket.remoteAddress || "").trim() || null;
}

async function getActorId(req: Request | undefined, explicitActorId: number | null | undefined) {
  if (explicitActorId !== undefined) return explicitActorId;
  if (!req) return null;
  return (await readSession(req))?.userId ?? null;
}

export async function logAuditEvent(input: AuditEventInput) {
  try {
    await ensureAuditSchema();

    await dbPool.query<ResultSetHeader>(
      `INSERT INTO audit_event
         (actor_user_id, action, entity_type, entity_id, details_json, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        await getActorId(input.req, input.actorId),
        input.action,
        input.entityType,
        input.entityId == null ? null : String(input.entityId),
        JSON.stringify(input.details ?? {}),
        getRequestIp(input.req),
        input.req?.get("user-agent")?.slice(0, 500) ?? null,
      ],
    );
  } catch (error) {
    console.warn("Audit logging failed:", error);
  }
}
