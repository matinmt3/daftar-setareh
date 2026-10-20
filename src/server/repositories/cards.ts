import { all, newId, nowIso, one, run } from "../db/connection";
import { mapReportCard, type ReportCardRow } from "../db/mappers";
import type { ReportCardData, ReportCardRecord, ReportCardType } from "@/lib/types";

export function findCard(
  userId: string,
  type: ReportCardType,
  periodStart: string,
): ReportCardRecord | null {
  const row = one<ReportCardRow>(
    "SELECT * FROM report_cards WHERE user_id = ? AND card_type = ? AND period_start = ?",
    [userId, type, periodStart],
  );
  return row ? mapReportCard(row) : null;
}

export function findCardById(userId: string, id: string): ReportCardRecord | null {
  const row = one<ReportCardRow>("SELECT * FROM report_cards WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? mapReportCard(row) : null;
}

export function listCards(userId: string, type?: ReportCardType, limit = 24): ReportCardRecord[] {
  const rows = type
    ? all<ReportCardRow>(
        `SELECT * FROM report_cards WHERE user_id = ? AND card_type = ?
         ORDER BY period_start DESC LIMIT ?`,
        [userId, type, limit],
      )
    : all<ReportCardRow>(
        `SELECT * FROM report_cards WHERE user_id = ?
         ORDER BY period_start DESC LIMIT ?`,
        [userId, limit],
      );
  return rows.map(mapReportCard);
}

export function upsertCard(input: {
  userId: string;
  type: ReportCardType;
  periodStart: string;
  periodEnd: string;
  data: ReportCardData;
  fingerprint: string;
}): ReportCardRecord {
  const existing = findCard(input.userId, input.type, input.periodStart);
  const now = nowIso();
  if (existing) {
    run(
      `UPDATE report_cards SET period_end = ?, data_json = ?, fingerprint = ?, generated_at = ?
       WHERE id = ? AND user_id = ?`,
      [input.periodEnd, JSON.stringify(input.data), input.fingerprint, now, existing.id, input.userId],
    );
    return findCardById(input.userId, existing.id) ?? existing;
  }
  const id = newId();
  run(
    `INSERT INTO report_cards (id, user_id, card_type, period_start, period_end, data_json, fingerprint, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.type,
      input.periodStart,
      input.periodEnd,
      JSON.stringify(input.data),
      input.fingerprint,
      now,
    ],
  );
  const card = findCardById(input.userId, id);
  if (!card) throw new Error("ساخت کارنامه انجام نشد.");
  return card;
}

export function countCards(userId: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM report_cards WHERE user_id = ?",
    [userId],
  );
  return row?.count ?? 0;
}

export function deleteCard(userId: string, id: string): void {
  run("DELETE FROM report_cards WHERE id = ? AND user_id = ?", [id, userId]);
}

export function listAllCardsForUser(userId: string): ReportCardRecord[] {
  return listCards(userId, undefined, 500);
}
