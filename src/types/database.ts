export type ExpertScope = 'International' | 'Nationale';

export type DocumentCategory =
  | 'diplome'
  | 'cv'
  | 'reference'
  | 'certificat'
  | 'administratif';

export interface DocumentAttachmentMeta {
  id: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ExpertProject {
  id: string;
  title: string;
  completionYear: number;
  country: string;
  domain: string;
  partnerName?: string;
  referenceCode?: string;
}

export interface Expert {
  id: string;
  code: string;
  lastName: string;
  firstName: string;
  scope: ExpertScope;
  nationality: string;
  country: string;
  domains: string[];
  yearsExperience: number;
  reference: string;
  email: string;
  website: string;
  attachments: DocumentAttachmentMeta[];
  projects: ExpertProject[];
  notes?: string;
  updatedAt: string;
}

export interface Subcontractor {
  id: string;
  code: string;
  name: string;
  country: string;
  domains: string[];
  contactName: string;
  email: string;
  website: string;
  phone: string;
  reference: string;
  adminDocuments?: DocumentAttachmentMeta[];
  notes?: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  country: string;
  domains: string[];
  reference: string;
  expertIds: string[];
  email: string;
  website: string;
  adminDocuments?: DocumentAttachmentMeta[];
  notes?: string;
  updatedAt: string;
}

export interface AtlasDatabaseState {
  experts: Expert[];
  subcontractors: Subcontractor[];
  partners: Partner[];
}

export type ActiveView =
  | 'dashboard'
  | 'experts'
  | 'subcontractors'
  | 'partners'
  | 'projects'
  | 'workbook';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  diplome: 'Diplôme',
  cv: 'CV',
  reference: 'Référence',
  certificat: 'Certificat / Attestation',
  administratif: 'Document administratif',
};
