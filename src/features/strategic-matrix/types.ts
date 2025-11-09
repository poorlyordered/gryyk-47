export interface StrategicMatrixDocument {
  id: string;
  title: string;
  content: string;
  category: 'corporation' | 'assets' | 'diplomacy' | 'operations' | 'threats' | 'opportunities';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}