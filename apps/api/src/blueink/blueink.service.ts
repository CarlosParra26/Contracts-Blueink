import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Client,
  createBlueinkClient,
  createBundle,
  retrieveBundle,
  cancelBundle,
  listBundleFiles,
  normalizeBlueinkApiUrl,
  type BuildBundleOptions,
} from "@contracts/blueink-client";

@Injectable()
export class BlueinkService implements OnModuleInit {
  private client!: Client;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>("BLUEINK_PRIVATE_API_KEY");
    const apiUrl = normalizeBlueinkApiUrl(
      this.config.get<string>("BLUEINK_API_URL"),
    );
    this.client = createBlueinkClient(apiKey, apiUrl);
  }

  getClient(): Client {
    return this.client;
  }

  createBundle(options: BuildBundleOptions) {
    return createBundle(this.client, options);
  }

  retrieveBundle(bundleId: string, relatedData = true) {
    return retrieveBundle(this.client, bundleId, relatedData);
  }

  cancelBundle(bundleId: string) {
    return cancelBundle(this.client, bundleId);
  }

  listBundleFiles(bundleId: string) {
    return listBundleFiles(this.client, bundleId);
  }

  async listBundles(params?: { status?: string; per_page?: number }) {
    const response = await this.client.bundles.list(params);
    return (response as { data?: unknown }).data ?? response;
  }
}
