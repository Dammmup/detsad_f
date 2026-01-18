// Document types
export type DocumentType = 'contract' | 'certificate' | 'report' | 'policy' | 'other';
export type DocumentCategory = 'staff' | 'children' | 'financial' | 'administrative' | 'other';
export type DocumentStatus = 'active' | 'archived';
export type TemplateType = DocumentType;
export type TemplateCategory = DocumentCategory;

export interface Document {
    id: string;
    title: string;
    type: DocumentType;
    category: DocumentCategory;
    status: DocumentStatus;
    fileName: string;
    fileSize: number;
    filePath: string;
    uploader: string;
    uploadDate: string | Date;
    expiryDate?: string | Date;
    description?: string;
    relatedId?: string;
    relatedType?: 'staff' | 'child' | 'group';
    tags: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface DocumentTemplate {
    id: string;
    name: string;
    type: TemplateType;
    category: TemplateCategory;
    fileName: string;
    fileSize: number;
    filePath: string;
    version: string;
    isActive: boolean;
    description?: string;
    tags: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
}
