import { Client } from "@blueink360/blueink-client-js";
import type { BlueinkTemplateField, BlueinkTemplateInfo } from "@contracts/domain";
import { wrapBlueinkError } from "./errors";

function normalizeTemplateFields(raw: unknown): BlueinkTemplateField[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const fieldsRaw = data.fields ?? data.documents;
  if (!Array.isArray(fieldsRaw)) return [];

  const result: BlueinkTemplateField[] = [];

  for (const item of fieldsRaw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;

    if (Array.isArray(entry.fields)) {
      for (const f of entry.fields) {
        const field = f as Record<string, unknown>;
        if (!field.key) continue;
        result.push({
          key: String(field.key),
          kind: String(field.kind ?? "inp"),
          label: field.label ? String(field.label) : undefined,
          page: typeof field.page === "number" ? field.page : undefined,
          role: extractFieldRole(field),
          required: Boolean(field.required),
        });
      }
      continue;
    }

    if (entry.key) {
      result.push({
        key: String(entry.key),
        kind: String(entry.kind ?? "inp"),
        label: entry.label ? String(entry.label) : undefined,
        page: typeof entry.page === "number" ? entry.page : undefined,
        role: extractFieldRole(entry),
        required: Boolean(entry.required),
      });
    }
  }

  return result;
}

function extractFieldRole(field: Record<string, unknown>): string | undefined {
  if (field.role) return String(field.role);
  if (Array.isArray(field.editor_roles) && field.editor_roles[0]) {
    const er = field.editor_roles[0];
    return typeof er === "string" ? er : String((er as { key?: string }).key ?? er);
  }
  if (Array.isArray(field.editors) && field.editors[0]) {
    return String(field.editors[0]);
  }
  return undefined;
}

function normalizeRoles(raw: unknown): Array<{ key: string; label?: string }> {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const rolesRaw = data.roles;
  if (!Array.isArray(rolesRaw)) return [];

  const roles: Array<{ key: string; label?: string }> = [];
  for (const r of rolesRaw) {
    if (typeof r === "string") {
      roles.push({ key: r, label: r });
      continue;
    }
    const role = r as Record<string, unknown>;
    const key = String(role.key ?? role.id ?? "");
    if (!key) continue;
    roles.push({
      key,
      label: role.label ? String(role.label) : key,
    });
  }
  return roles;
}

export function parseTemplateResponse(raw: unknown): BlueinkTemplateInfo {
  const data = (raw as { data?: unknown })?.data ?? raw;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid BlueInk template response");
  }
  const template = data as Record<string, unknown>;
  const fields = normalizeTemplateFields(template);
  const roles = normalizeRoles(template);

  return {
    id: String(template.id ?? template.template_id ?? ""),
    name: template.name ? String(template.name) : undefined,
    roles,
    fields,
    fieldCount: fields.length,
    signerCount: roles.length,
  };
}

export async function retrieveTemplate(
  client: Client,
  templateId: string,
): Promise<BlueinkTemplateInfo> {
  try {
    const response = await client.templates.retrieve(templateId);
    return parseTemplateResponse(response);
  } catch (error) {
    throw wrapBlueinkError(error);
  }
}

export function buildTemplateFieldValues(
  fields: Record<string, string | number | boolean>,
): Array<{ key: string; initial_value: string; value: string }> {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => {
      const str = String(value);
      return { key, initial_value: str, value: str };
    });
}
