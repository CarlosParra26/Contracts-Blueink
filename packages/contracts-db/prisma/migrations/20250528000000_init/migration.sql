-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "match_id" TEXT,
    "metadata" JSONB,
    "blueink_bundle_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "status_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requester_email" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "signers" JSONB NOT NULL,
    "field_values" JSONB NOT NULL,
    "signed_pdf_path" TEXT,
    "signed_pdf_url" TEXT,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_events" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_contract_type_status_idx" ON "contracts"("contract_type", "status");

-- CreateIndex
CREATE INDEX "contracts_blueink_bundle_id_idx" ON "contracts"("blueink_bundle_id");

-- CreateIndex
CREATE INDEX "contracts_match_id_idx" ON "contracts"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_events_event_id_key" ON "contract_events"("event_id");

-- CreateIndex
CREATE INDEX "contract_events_contract_id_idx" ON "contract_events"("contract_id");

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
