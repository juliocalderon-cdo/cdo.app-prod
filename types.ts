

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERADOR_IMPO = 'OPERADOR IMPO',
  MONITOR_IMPO = 'MONITOR IMPO',
}

export interface User {
  username: string; // Now the primary identifier
  name: string;
  role: UserRole;
  email?: string; // Optional field
  password?: string;
}


export enum DownloadType {
  TATA = 'TATA',
  HYG = 'HYG',
  BAS = 'BAS',
}

export interface Article {
  id: string;
  sku: string;
  barcode?: string;
  description: string;
  quantity: number; // Total quantity from manifest (stock + cross)
  quantityStock: number;
  quantityCross: number;
  madre: string;
}

export enum IlpnType {
  STOCK = 'STOCK',
  CROSS = 'CROSS',
}

// Represents a specific article and its quantity within a single iLPN
export interface iLPNArticle {
  articleId: string; // To link back to the original Article
  sku: string;
  barcode?: string;
  description: string;
  quantity: number; // Quantity of this article in this iLPN
}

export interface iLPN {
  id: string;
  type: IlpnType;
  madre: string;
  articles: iLPNArticle[];
  isClosed: boolean;
  createdAt: string;
  user: string; // Name of the user who created this iLPN
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskType {
  DOWNLOAD = 'DOWNLOAD',
}

export interface DownloadTask {
  id: string;
  taskType: TaskType;
  fileName: string;
  downloadType: DownloadType;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: TaskStatus;
  articles: Article[]; // Master list of what needs to be received
  openILPNs: iLPN[];
  closedILPNs: iLPN[];
  analysis?: string;
  user: string;
}