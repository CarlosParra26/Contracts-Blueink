import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SignerDto {
  @IsString()
  @MinLength(1)
  role!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  order?: number;
}

export class SendContractDto {
  @IsUUID()
  templateId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDto)
  signers!: SignerDto[];

  @IsObject()
  @IsOptional()
  fields?: Record<string, string | number | boolean>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  matchId?: string;

  @IsString()
  @MinLength(1)
  requesterName!: string;

  @IsEmail()
  requesterEmail!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailMessage?: string;

  @IsBoolean()
  @IsOptional()
  send?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isTest?: boolean = false;
}
