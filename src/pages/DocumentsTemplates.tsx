import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, MenuItem,
  Grid, IconButton, Tooltip, Chip, FormControl, InputLabel, Select
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

import { getDocumentTemplates, downloadDocumentTemplate } from '../services/documents';

// Тип для шаблона документа
interface DocumentTemplate {
  id: string;
  name: string;
 description: string;
 type: 'contract' | 'report' | 'certificate' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  fileName: string;
  fileSize: number;
  filePath: string;
  version: string;
  tags: string[];
}

const DocumentsTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Загрузка и фильтрация шаблонов
  useEffect(() => {
    const loadAndFilterTemplates = async () => {
      setLoading(true);
      try {
        // Загружаем шаблоны из API
        const templatesData = await getDocumentTemplates();
        const templatesList = templatesData.data?.map((template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          type: template.type,
          category: template.category,
          fileName: template.fileName,
          fileSize: template.fileSize,
          filePath: template.filePath,
          version: template.version,
          tags: template.tags || []
        })) || [];
        
        setTemplates(templatesList);
        
        // Применяем фильтры к загруженным шаблонам
        let filtered = [...templatesList];
        
        // Поиск по названию и описанию
        if (searchTerm) {
          filtered = filtered.filter(template =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        // Фильтр по типу
        if (filterType) {
          filtered = filtered.filter(template => template.type === filterType);
        }
        
        // Фильтр по категории
        if (filterCategory) {
          filtered = filtered.filter(template => template.category === filterCategory);
        }
        
        setFilteredTemplates(filtered);
        setPage(0); // Сброс на первую страницу при изменении фильтров
      } catch (err) {
        setError('Не удалось загрузить шаблоны документов. Пожалуйста, обновите страницу.');
        console.error('Ошибка загрузки шаблонов:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAndFilterTemplates();
  }, [searchTerm, filterType, filterCategory]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadTemplate = (template: DocumentTemplate) => {
    // Скачивание шаблона через API
    downloadDocumentTemplate(template.id);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'contract': return 'Договор';
      case 'report': return 'Отчет';
      case 'certificate': return 'Справка';
      case 'policy': return 'Политика';
      default: return 'Другое';
    }
  };

  const getCategoryText = (category: string): string => {
    switch (category) {
      case 'staff': return 'Сотрудники';
      case 'children': return 'Дети';
      case 'financial': return 'Финансы';
      case 'administrative': return 'Администрация';
      default: return 'Другое';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <PdfIcon color="error" />;
      case 'xlsx':
      case 'xls': return <ExcelIcon color="success" />;
      case 'doc':
      case 'docx': return <FileIcon color="primary" />;
      default: return <FileIcon />;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Шаблоны документов
        </Typography>
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            label="Поиск"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 20 }} />
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Тип</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Тип"
            >
              <MenuItem value="">Все типы</MenuItem>
              <MenuItem value="contract">Договор</MenuItem>
              <MenuItem value="report">Отчет</MenuItem>
              <MenuItem value="certificate">Справка</MenuItem>
              <MenuItem value="policy">Политика</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Категория</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Категория"
            >
              <MenuItem value="">Все категории</MenuItem>
              <MenuItem value="staff">Сотрудники</MenuItem>
              <MenuItem value="children">Дети</MenuItem>
              <MenuItem value="financial">Финансы</MenuItem>
              <MenuItem value="administrative">Администрация</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setFilterType('');
              setFilterCategory('');
              setSearchTerm('');
            }}
          >
            Сбросить
          </Button>
        </Box>
      </Paper>

      {/* Таблица шаблонов */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Файл</TableCell>
                <TableCell>Версия</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getFileIcon(template.fileName)}
                        <Box ml={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {template.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {template.tags.map((tag, index) => (
                              <Chip 
                                key={index} 
                                label={tag} 
                                size="small" 
                                variant="outlined" 
                                sx={{ height: 20 }} 
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{getTypeText(template.type)}</TableCell>
                    <TableCell>{getCategoryText(template.category)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{template.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(template.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`v${template.version}`} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadTemplate(template)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTemplates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`}
        />
      </Paper>
    </Box>
  );
};

export default DocumentsTemplates;
