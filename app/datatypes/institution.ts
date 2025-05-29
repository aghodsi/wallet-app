export type InstitutionType = {
  id: number;
  name: string;
  isDefault: boolean;
  website?: string;
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  lastUpdated: string;
  isNew: boolean;
};
