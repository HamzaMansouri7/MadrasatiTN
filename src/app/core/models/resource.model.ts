import { GradeLevel, SubjectName, Trimester, DocType } from './education.model';
import { ResourceInteractionSummary } from './interaction.model';

export type ResourceKind = 'exercise' | 'article' | 'document' | 'pack' | 'book';

export interface EditorBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'qcm' | 'true_false' | 'fill_blank' | 'match_arrows' | 'image' | 'callout';
  content: string;
  data?: any;
}

export interface ResourceMeta {
  id: string;
  kind: ResourceKind;
  title: string;
  subject: SubjectName;
  grade: GradeLevel;
  trimester?: Trimester;
  docType?: DocType;
  topic?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  watermarkText: string;
  bookRef?: {
    bookId: string;
    chapter?: string;
  };
  summaryStats?: ResourceInteractionSummary;
  createdAt: string;
}

export interface Resource extends ResourceMeta {
  blocks?: EditorBlock[];
  imageUrls?: string[];
  pdfUrl?: string;
  resourceIds?: string[];
  aiGenerated?: boolean;
  aiVerified?: boolean;
}
