export interface BlueinkTemplateField {
  key: string;
  kind: string;
  label?: string;
  page?: number;
  role?: string;
  required?: boolean;
}

export interface BlueinkTemplateInfo {
  id: string;
  name?: string;
  roles: Array<{ key: string; label?: string }>;
  fields: BlueinkTemplateField[];
  fieldCount: number;
  signerCount: number;
}
