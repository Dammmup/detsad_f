import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, IconButton,
  Tooltip, Chip, Divider, FormControl, InputLabel, Select, SelectChangeEvent,
 CircularProgress, Alert, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as FileIcon,
  LibraryBooks as TemplateIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { formatFileSize, getFileIcon, getTypeText, getCategoryText } from '../utils/documentUtils';
import { ru } from 'date-fns/locale';
// Убран импорт downloadDocumentTemplate, так как теперь используем статические данные
import { Document as DocumentType } from '../types/documents';
import ExportAutoTemplatesButton from '../components/ExportAutoTemplatesButton';
import { generalTemplates } from '../utils/documentTemplates';
import { getStatusColor } from '../utils/format';

export const Documents= () => {
 const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [templatePage, setTemplatePage] = useState(0);
  const [templateRowsPerPage, setTemplateRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Partial<DocumentType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Для создания документа из шаблона
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Функция для преобразования статических шаблонов в формат таблицы
  const transformTemplate = (template: any) => {
    // Определяем расширение файла на основе формата
    let extension = 'pdf';
    if (template.format === 'xlsx') {
      extension = 'xlsx';
    } else if (template.format === 'docx') {
      extension = 'docx';
    }
    
    return {
      id: template.template,
      name: template.label.replace(/\s*\(.*?\)/, ''), // Убираем формат из названия
      description: '', // В статических шаблонах нет описания
      type: 'other', // По умолчанию тип "другое"
      category: 'other', // По умолчанию категория "другое"
      fileName: `${template.label.replace(/\s*\(.*?\)/, '').toLowerCase().replace(/\s+/g, '_')}.${extension}`,
      fileSize: 0, // Размер файла неизвестен для статических шаблонов
      filePath: '', // Путь к файлу неизвестен
      version: '1.0', // Версия по умолчанию
      tags: [], // Теги отсутствуют в статических шаблонах
      ...template // Сохраняем все остальные свойства
    };
  };
  
  // Инициализация данных без вызовов к бэкенду
  useEffect(() => {
    // Преобразуем статические шаблоны в формат таблицы
    const transformedTemplates = generalTemplates.map(transformTemplate);
    setFilteredTemplates(transformedTemplates);
    setTemplates(transformedTemplates);
    
    // Отключаем загрузку документов с сервера
    setLoading(false);
    setTemplateLoading(false);
  }, []);

  // Применение фильтров
  useEffect(() => {
    let filtered = [...documents];
    
    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Фильтр по типу
    if (filterType) {
      filtered = filtered.filter(doc => doc.type === filterType);
    }
    
    // Фильтр по категории
    if (filterCategory) {
      filtered = filtered.filter(doc => doc.category === filterCategory);
    }
    
    // Фильтр по статусу
    if (filterStatus) {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }
    
    setFilteredDocuments(filtered);
    setPage(0); // Сброс на первую страницу при изменении фильтров
  }, [documents, searchTerm, filterType, filterCategory, filterStatus]);

  const handleOpenDialog = (document?: DocumentType) => {
    setCurrentDocument(document || {
      title: '',
      type: 'other',
      category: 'other',
      status: 'active',
      tags: []
    });
    setFile(null);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDocument(null);
    setFile(null);
  };
  
 const handleOpenTemplateDialog = () => {
    setOpenTemplateDialog(true);
 };
  
  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
    setSelectedTemplate(null);
  };
  
  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      setCurrentDocument({
        title: selectedTemplate.name,
        type: selectedTemplate.type || 'other',
        category: selectedTemplate.category || 'other',
        status: 'active',
        tags: selectedTemplate.tags || []
      });
      setFile(null);
      setOpenDialog(true);
      handleCloseTemplateDialog();
    }
  };
  
  const handleSaveDocument = async () => {
    if (!currentDocument) return;
    
    // Mock-функция сохранения документа без вызова бэкенда
    try {
      if (currentDocument.id) {
        // Редактирование существующего документа (mock)
        setDocuments(documents.map(doc =>
          doc.id === currentDocument.id ? {...doc, ...currentDocument} : doc
        ));
      } else {
        // Добавление нового документа (mock)
        if (!file) {
          setError('Пожалуйста, выберите файл документа');
          return;
        }
        
        const newDocument = {
          id: Date.now().toString(),
          title: currentDocument.title || '',
          description: currentDocument.description,
          type: currentDocument.type as any,
          category: currentDocument.category as any,
          fileName: file.name,
          fileSize: file.size,
          filePath: '',
          uploadDate: new Date().toISOString(),
          uploader: {
            id: 'mock-user-id',
            fullName: 'Mock User',
            email: 'mock@example.com'
          },
          status: currentDocument.status || 'active',
          tags: currentDocument.tags || [],
          version: '1.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setDocuments([...documents, newDocument as DocumentType]);
      }
      
      handleCloseDialog();
    } catch (error: any) {
      console.error('Ошибка сохранения документа:', error);
      setError(error.message || 'Не удалось сохранить документ');
    }
  };
  
  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Удалить документ?')) {
      try {
        // Mock-функция удаления документа без вызова бэкенда
        setDocuments(documents.filter(doc => doc.id !== id));
      } catch (error) {
        console.error('Ошибка удаления документа:', error);
        setError('Не удалось удалить документ');
      }
    }
  };
  
  const handleDownloadDocument = async (id: string) => {
    try {
      // Mock-функция скачивания документа без вызова бэкенда
      console.log(`Запрошено скачивание документа с ID: ${id}`);
      // Здесь можно реализовать логику скачивания файла, если это необходимо
    } catch (error) {
      console.error('Ошибка скачивания документа:', error);
      setError('Не удалось скачать документ');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  setRowsPerPage(parseInt(event.target.value, 10));
  setPage(0);
};

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Документы
        </Typography>
        <ExportAutoTemplatesButton templates={generalTemplates} />
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<TemplateIcon />}
            onClick={handleOpenTemplateDialog}
            sx={{ mr: 2 }}
          >
            Создать из шаблона
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Добавить документ
          </Button>
        </Box>
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
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Статус"
            >
              <MenuItem value="">Все статусы</MenuItem>
              <MenuItem value="active">Активен</MenuItem>
              <MenuItem value="archived">Архивирован</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setFilterType('');
              setFilterCategory('');
              setFilterStatus('');
              setSearchTerm('');
            }}
          >
            Сбросить
          </Button>
        </Box>
      </Paper>
      
      {/* Таблица документов */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Файл</TableCell>
                <TableCell>Дата загрузки</TableCell>
                <TableCell>Загрузил</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getFileIcon(document.fileName)}
                        <Box ml={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {document.title}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {document.tags.map((tag, index) => (
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
                    <TableCell>{getTypeText(document.type)}</TableCell>
                    <TableCell>{getCategoryText(document.category)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{document.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(document.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(document.uploadDate), 'dd.MM.yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>{document.uploader.fullName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={document.status === 'active' ? 'Активен' : 'Архивирован'}
                        color={getStatusColor(document.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadDocument(document.id)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редактировать">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(document)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteDocument(document.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredDocuments.length === 0 && (
          <Box p={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              Нет документов
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Создайте документ из шаблона или загрузите новый файл
            </Typography>
            <Box mt={2}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<TemplateIcon />}
                onClick={handleOpenTemplateDialog}
                sx={{ mr: 2 }}
              >
                Создать из шаблона
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Добавить документ
              </Button>
            </Box>
          </Box>
        )}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`}
        />
      </Paper>
      
      {/* Секция шаблонов */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TemplateIcon sx={{ mr: 1 }} />
          Шаблоны документов
        </Typography>
        
        {templateLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : (
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
                    .slice(templatePage * templateRowsPerPage, templatePage * templateRowsPerPage + templateRowsPerPage)
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
                                {template.tags.map((tag: string, index: number) => (
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
                        </TableCell>
                        <TableCell>
                          <Chip label={`v${template.version}`} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Скачать">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // Mock-функция скачивания шаблона без вызова бэкенда
                                console.log(`Запрошено скачивание шаблона: ${template.name} (ID: ${template.id})`);
                                alert(`Скачивание шаблона "${template.name}" пока не реализовано в демонстрационной версии.`);
                              }}
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
            {filteredTemplates.length === 0 && (
              <Box p={4} textAlign="center">
                <Typography variant="h6" color="text.secondary">
                  Нет доступных шаблонов
                </Typography>
              </Box>
            )}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredTemplates.length}
              rowsPerPage={templateRowsPerPage}
              page={templatePage}
              onPageChange={(event, newPage) => setTemplatePage(newPage)}
              onRowsPerPageChange={(event) => {
                setTemplateRowsPerPage(parseInt(event.target.value, 10));
                setTemplatePage(0);
              }}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`}
            />
          </Paper>
        )}
      </Box>

      {/* Диалог редактирования/создания документа */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentDocument?.id ? 'Редактировать документ' : 'Добавить документ'}
        </DialogTitle>
        <DialogContent dividers>
          {currentDocument && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Название документа"
                  value={currentDocument.title || ''}
                  onChange={(e) => setCurrentDocument({
                    ...currentDocument,
                    title: e.target.value
                  })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание"
                  multiline
                  rows={3}
                  value={currentDocument.description || ''}
                  onChange={(e) => setCurrentDocument({
                    ...currentDocument,
                    description: e.target.value
                  })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип документа</InputLabel>
                  <Select
                    value={currentDocument.type || ''}
                    onChange={(e) => setCurrentDocument({
                      ...currentDocument,
                      type: e.target.value as any
                    })}
                    label="Тип документа"
                  >
                    <MenuItem value="contract">Договор</MenuItem>
                    <MenuItem value="report">Отчет</MenuItem>
                    <MenuItem value="certificate">Справка</MenuItem>
                    <MenuItem value="policy">Политика</MenuItem>
                    <MenuItem value="other">Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Категория</InputLabel>
                  <Select
                    value={currentDocument.category || ''}
                    onChange={(e) => setCurrentDocument({
                      ...currentDocument,
                      category: e.target.value as any
                    })}
                    label="Категория"
                  >
                    <MenuItem value="staff">Сотрудники</MenuItem>
                    <MenuItem value="children">Дети</MenuItem>
                    <MenuItem value="financial">Финансы</MenuItem>
                    <MenuItem value="administrative">Администрация</MenuItem>
                    <MenuItem value="other">Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    value={currentDocument.status || ''}
                    onChange={(e) => setCurrentDocument({
                      ...currentDocument,
                      status: e.target.value as any
                    })}
                    label="Статус"
                  >
                    <MenuItem value="active">Активен</MenuItem>
                    <MenuItem value="archived">Архивирован</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Теги (через запятую)"
                  value={currentDocument.tags?.join(', ') || ''}
                  onChange={(e) => setCurrentDocument({
                    ...currentDocument,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                />
              </Grid>
              
              {!currentDocument.id && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="center" alignItems="center" p={2} 
                       border="1px dashed #ccc" borderRadius={1}>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      component="label"
                    >
                      Выбрать файл
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) {
                            setFile(selectedFile);
                          }
                        }}
                      />
                    </Button>
                    <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
                      {file ? file.name : 'Перетащите файл сюда или нажмите для выбора'}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSaveDocument} 
            variant="contained" 
            color="primary"
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог выбора шаблона */}
      <Dialog open={openTemplateDialog} onClose={handleCloseTemplateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Создать документ из шаблона
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={filteredTemplates}
            getOptionLabel={(option) => option.name}
            value={selectedTemplate}
            onChange={(event, newValue) => setSelectedTemplate(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Выберите шаблон" 
                variant="outlined" 
                fullWidth 
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box mr={2}>
                    {getFileIcon(option.fileName)}
                  </Box>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
          />
          {selectedTemplate && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2">Описание шаблона:</Typography>
              <Typography variant="body2">{selectedTemplate.description}</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {selectedTemplate.tags.map((tag: string, index: number) => (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Отмена</Button>
          <Button 
            onClick={handleCreateFromTemplate} 
            variant="contained" 
            color="primary"
            disabled={!selectedTemplate}
          >
            Создать документ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
