import { Client, BundleHelper } from "@blueink360/blueink-client-js";
import type { SendContractInput } from "@contracts/domain";
import { wrapBlueinkError } from "./errors";
import { buildTemplateFieldValues } from "./template";

const DEFAULT_EMAIL_SUBJECT = "Document for Signature";
const DEFAULT_EMAIL_MESSAGE =
  "Please review and sign the attached document.";

export interface BuildBundleOptions {
  input: SendContractInput;
  templateId: string;
  templateName?: string;
}

export interface BuiltBundleResult {
  bundleData: ReturnType<BundleHelper["asData"]>;
  signerKeyByRole: Record<string, string>;
  docKey: string;
}

export function buildBundleFromTemplate(
  options: BuildBundleOptions,
): BuiltBundleResult {
  const { input, templateId, templateName } = options;

  const bundleHelper = new BundleHelper({
    label:
      input.label ??
      `${templateName ?? "Contract"} - ${input.metadata?.reference ?? new Date().toISOString()}`,
    requester_email: input.requesterEmail,
    requester_name: input.requesterName,
    email_subject: input.emailSubject ?? DEFAULT_EMAIL_SUBJECT,
    email_message: input.emailMessage ?? DEFAULT_EMAIL_MESSAGE,
    custom_key: input.matchId,
    is_test: input.isTest,
    status: input.send ? "" : "dr",
  });

  const fieldValues = buildTemplateFieldValues(input.fields);

  const docKey = bundleHelper.addDocumentTemplate({
    template_id: templateId,
    ...(fieldValues.length > 0 ? { field_values: fieldValues } : {}),
  });

  const signerKeyByRole: Record<string, string> = {};
  const sortedSigners = [...input.signers].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  for (const signer of sortedSigners) {
    signerKeyByRole[signer.role] = bundleHelper.addSigner({
      name: signer.name,
      email: signer.email,
      key: signer.role,
      order: signer.order ?? 0,
    });
  }

  for (const signer of sortedSigners) {
    const signerKey = signerKeyByRole[signer.role];
    if (signerKey) {
      bundleHelper.assignRole(signerKey, docKey, signer.role);
    }
  }

  return {
    bundleData: bundleHelper.asData(),
    signerKeyByRole,
    docKey,
  };
}

export async function createBundle(
  client: Client,
  options: BuildBundleOptions,
): Promise<{ bundleId: string; status: string; raw: unknown }> {
  try {
    const { bundleData } = buildBundleFromTemplate(options);
    const response = await client.bundles.create(bundleData);
    const data =
      (response as { data?: { id?: string; status?: string } }).data ?? response;
    const bundle = data as { id?: string; slug?: string; status?: string };
    const bundleId = bundle.id ?? bundle.slug;
    if (!bundleId) {
      throw new Error("BlueInk did not return a bundle id");
    }
    return {
      bundleId: String(bundleId),
      status: bundle.status ?? (options.input.send ? "se" : "dr"),
      raw: data,
    };
  } catch (error) {
    throw wrapBlueinkError(error);
  }
}

export async function retrieveBundle(
  client: Client,
  bundleId: string,
  relatedData = true,
) {
  try {
    const response = await client.bundles.retrieve(bundleId, {
      related_data: relatedData,
    });
    return (response as { data?: unknown }).data ?? response;
  } catch (error) {
    throw wrapBlueinkError(error);
  }
}

export async function cancelBundle(client: Client, bundleId: string) {
  try {
    return await client.bundles.cancel(bundleId);
  } catch (error) {
    throw wrapBlueinkError(error);
  }
}

export async function listBundleFiles(client: Client, bundleId: string) {
  try {
    const response = await client.bundles.listFiles(bundleId);
    return (response as { data?: unknown }).data ?? response;
  } catch (error) {
    throw wrapBlueinkError(error);
  }
}

export function createBlueinkClient(apiKey?: string, apiUrl?: string): Client {
  if (apiUrl) {
    return new Client(
      apiKey ?? process.env.BLUEINK_PRIVATE_API_KEY ?? "",
      apiUrl,
    );
  }
  return new Client(apiKey ?? process.env.BLUEINK_PRIVATE_API_KEY ?? "");
}
