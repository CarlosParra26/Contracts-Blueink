declare module "@blueink360/blueink-client-js" {
  export class Client {
    constructor(apiKey?: string, apiUrl?: string);
    bundles: {
      create(data: unknown): Promise<{ data?: unknown }>;
      retrieve(
        id: string,
        opts?: { related_data?: boolean },
      ): Promise<{ data?: unknown }>;
      cancel(id: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<{ data?: unknown }>;
      listFiles(id: string): Promise<{ data?: unknown }>;
    };
    packets: {
      remind(packetId: string): Promise<unknown>;
    };
    templates: {
      retrieve(templateId: string): Promise<{ data?: unknown }>;
      list(params?: Record<string, unknown>): Promise<{ data?: unknown }>;
    };
  }

  export class BundleHelper {
    constructor(opts: Record<string, unknown>);
    addDocumentTemplate(opts: {
      template_id: string;
      field_values?: Array<{ key: string; initial_value?: string; value?: string }>;
      key?: string;
    }): string;
    addSigner(opts: Record<string, unknown>): string;
    assignRole(signerKey: string, docKey: string, roleKey: string): void;
    asData(): unknown;
  }
}
