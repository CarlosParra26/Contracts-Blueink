import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import fs from "fs";

export interface ContractRecord {
  id: string;
  contractType: string;
  requesterEmail: string;
  signers: unknown;
  signedPdfPath?: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>("SMTP_HOST");
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get("SMTP_PORT") ?? 587),
        secure: false,
        auth: {
          user: config.get("SMTP_USER"),
          pass: config.get("SMTP_PASS"),
        },
      });
    }
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    attachmentPath?: string | null,
  ) {
    const from = this.config.get("EMAIL_FROM") ?? "noreply@contracts.local";
    if (!this.transporter) {
      this.logger.log(
        `[email skipped] To: ${to} | ${subject}\n${text}${attachmentPath ? `\nAttachment: ${attachmentPath}` : ""}`,
      );
      return;
    }

    const mail: nodemailer.SendMailOptions = { from, to, subject, text };
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      mail.attachments = [
        {
          filename: `signed-contract-${Date.now()}.pdf`,
          path: attachmentPath,
        },
      ];
    }
    await this.transporter.sendMail(mail);
  }

  async sendContractSent(contract: ContractRecord) {
    const signers = contract.signers as Array<{ email: string; name: string }>;
    for (const signer of signers) {
      await this.send(
        signer.email,
        `Contract sent: ${contract.contractType}`,
        `Hello ${signer.name},\n\nA contract (${contract.contractType}) has been sent for your signature.\nContract ID: ${contract.id}\n`,
      );
    }
  }

  async sendContractCompleted(contract: ContractRecord) {
    const signers = contract.signers as Array<{ email: string; name: string }>;
    const recipients = new Set<string>([
      contract.requesterEmail,
      ...signers.map((s) => s.email),
    ]);

    for (const email of recipients) {
      await this.send(
        email,
        `Contract signed: ${contract.contractType}`,
        `The contract ${contract.id} has been fully signed. A copy of the signed document is attached.\n`,
        contract.signedPdfPath,
      );
    }
  }

  async sendContractDeclined(contract: ContractRecord) {
    await this.send(
      contract.requesterEmail,
      `Contract declined: ${contract.contractType}`,
      `Contract ${contract.id} was declined by a signer.\n`,
    );
  }

  async sendReminder(contract: ContractRecord, email?: string) {
    if (!email) return;
    await this.send(
      email,
      `Reminder: sign ${contract.contractType}`,
      `This is a reminder to sign contract ${contract.id}.\n`,
    );
  }
}
