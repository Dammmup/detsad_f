import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ExcelIcon from '@mui/icons-material/TableChart';
import FileIcon from '@mui/icons-material/InsertDriveFile';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <PdfIcon color="error" />;
    case 'xlsx':
    case 'xls': return <ExcelIcon color="success" />;
    case 'doc':
    case 'docx': return <FileIcon color="primary" />;
    default: return <FileIcon />;
  }
}

export function getTypeText(type: string): string {
  switch (type) {
    case 'contract': return 'Договор';
    case 'report': return 'Отчет';
    case 'certificate': return 'Справка';
    case 'policy': return 'Политика';
    default: return 'Другое';
  }
}

export function getCategoryText(category: string): string {
  switch (category) {
    case 'staff': return 'Сотрудники';
    case 'children': return 'Дети';
    case 'financial': return 'Финансы';
    case 'administrative': return 'Администрация';
    default: return 'Другое';
  }
}
