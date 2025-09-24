import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, IconButton,
  Tooltip, Chip, Divider, FormControl, InputLabel, Select, SelectChangeEvent,
 CircularProgress, Alert, Card, CardContent, Autocomplete
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
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getDocuments, createDocument, updateDocument, deleteDocument, downloadDocument } from '../../services/api/documents';
import { usersApi } from '../../services/api/users';

interface StaffMember {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface StaffDocument {
  id: string;
  title: string;
  type: 'contract' | 'certificate' | 'report' | 'other';
  staffId: string;
  staffName: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  expiryDate?: Date;
  uploader: string;
  status: 'active' | 'expired' | 'archived';
  tags: string[];
}

const StaffDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<StaffDocument[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Partial<StaffDocument> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStaff, setFilterStaff] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем документы сотрудников и список сотрудников
        const [documentsData, staffData] = await Promise.all([
          getDocuments({ category: 'staff' }),
          usersApi.getAll({ type: 'adult' }) // предполагаем, что сотрудники - это взрослые пользователи
        ]);
        
        // Преобразуем данные из API в формат, используемый в компоненте
        const staffDocuments = documentsData.data?.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          staffId: doc.relatedId,
          staffName: doc.uploader?.fullName || 'Неизвестный',
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          uploadDate: new Date(doc.uploadDate),
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
          uploader: doc.uploader?.fullName || 'Система',
          status: doc.status,
          tags: doc.tags || []
        })) || [];
        
        const staffMembersList = staffData.map((user: any) => ({
          id: user.id,
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          position: user.position || user.role || 'Сотрудник',
          department: user.department || 'Не указано'
        }));
        
        setStaffMembers(staffMembersList);
        setDocuments(staffDocuments);
        setFilteredDocuments(staffDocuments);
      } catch (err) {
        setError('Не удалось загрузить документы сотрудников. Пожалуйста, обновите страницу.');
        console.error('Ошибка загрузки документов:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Примение фильтров
  useEffect(() => {
    let filtered = [...documents];
    
    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Фильтр по типу
    if (filterType) {
      filtered = filtered.filter(doc => doc.type === filterType);
    }
    
    // Фильтр по сотруднику
    if (filterStaff) {
      filtered = filtered.filter(doc => doc.staffId === filterStaff);
    }
    
    // Фильтр по статусу
    if (filterStatus) {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }
    
    setFilteredDocuments(filtered);
    setPage(0); // Сброс на первую страницу при изменении фильтров
  }, [documents, searchTerm, filterType, filterStaff, filterStatus]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (document?: StaffDocument) => {
    setCurrentDocument(document || {
      title: '',
      type: 'other',
      staffId: '',
      staffName: '',
      status: 'active',
      tags: []
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDocument(null);
  };

  const handleSaveDocument = async () => {
    if (!currentDocument) return;

    try {
      // Подготовка данных для API
      const documentData = {
        title: currentDocument.title || '',
        type: currentDocument.type || 'other',
        category: 'staff' as const, // ограничиваем значение типом
        relatedId: currentDocument.staffId,
        relatedType: 'staff' as const,
        tags: currentDocument.tags || [],
        expiryDate: currentDocument.expiryDate ? new Date(currentDocument.expiryDate).toISOString() : undefined,
        description: currentDocument.title // используем заголовок как описание
      };
      
      let savedDocument: any;
      if (currentDocument.id) {
        // Обновление существующего документа
        savedDocument = await updateDocument(currentDocument.id, documentData);
        
        // Обновляем список документов
        setDocuments(documents.map(doc =>
          doc.id === currentDocument.id ? {
            ...doc,
            title: savedDocument.title,
            type: savedDocument.type,
            staffId: savedDocument.relatedId,
            staffName: savedDocument.uploader?.fullName || doc.staffName,
            fileName: savedDocument.fileName || doc.fileName,
            fileSize: savedDocument.fileSize || doc.fileSize,
            uploadDate: savedDocument.uploadDate ? new Date(savedDocument.uploadDate) : doc.uploadDate,
            expiryDate: savedDocument.expiryDate ? new Date(savedDocument.expiryDate) : doc.expiryDate,
            uploader: savedDocument.uploader?.fullName || doc.uploader,
            status: savedDocument.status,
            tags: savedDocument.tags || doc.tags
          } as StaffDocument : doc
        ));
      } else {
        // Создание нового документа - в этом месте мы можем только создать запись
        // но загрузка файла будет происходить отдельно, так как нам нужен объект File
        // Пока создадим документ с базовой информацией
        savedDocument = await createDocument({
          ...documentData,
          file: new File([], 'temp_placeholder.pdf') // временный placeholder
        } as any);
        
        // Находим имя сотрудника по ID
        const staff = staffMembers.find(s => s.id === currentDocument.staffId);
        
        // Добавляем новый документ в список
        const newDocument: StaffDocument = {
          id: savedDocument.id,
          title: savedDocument.title,
          type: savedDocument.type,
          staffId: savedDocument.relatedId || '',
          staffName: staff?.fullName || savedDocument.uploader?.fullName || '',
          fileName: savedDocument.fileName || 'новый_документ.pdf',
          fileSize: savedDocument.fileSize || 0,
          uploadDate: savedDocument.uploadDate ? new Date(savedDocument.uploadDate) : new Date(),
          expiryDate: savedDocument.expiryDate ? new Date(savedDocument.expiryDate) : undefined,
          uploader: savedDocument.uploader?.fullName || 'Текущий пользователь',
          status: savedDocument.status,
          tags: savedDocument.tags || []
        };
        setDocuments([...documents, newDocument]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка сохранения документа:', error);
      setError('Не удалось сохранить документ');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Удалить документ сотрудника?')) {
      try {
        // Удаляем документ через API
        await deleteDocument(id);
        
        // Обновляем список документов
        setDocuments(documents.filter(doc => doc.id !== id));
      } catch (error) {
        console.error('Ошибка удаления документа:', error);
        setError('Не удалось удалить документ');
      }
    }
  };

  const handleDownloadDocument = (document: StaffDocument) => {
    // Скачивание документа через API
    downloadDocument(document.id);
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
      case 'certificate': return 'Справка';
      case 'report': return 'Отчет';
      default: return 'Другое';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return 'Активен';
      case 'expired': return 'Истёк';
      case 'archived': return 'Архивирован';
      default: return status;
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

  const getExpiringDocumentsCount = () => {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    
    return documents.filter(doc => 
      doc.expiryDate && 
      new Date(doc.expiryDate) > now && 
      new Date(doc.expiryDate) <= nextMonth
    ).length;
  };

  const getExpiredDocumentsCount = () => {
    const now = new Date();
    return documents.filter(doc => 
      doc.expiryDate && 
      new Date(doc.expiryDate) < now
    ).length;
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
        <Typography variant="h4" component="h1">
          Документы сотрудников
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить документ
        </Button>
      </Box>

      {/* Статистика */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Всего документов</Typography>
              <Typography variant="h4">{documents.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Истекают в течение месяца</Typography>
              <Typography variant="h4">{getExpiringDocumentsCount()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Истёкшие документы</Typography>
              <Typography variant="h4">{getExpiredDocumentsCount()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              <MenuItem value="certificate">Справка</MenuItem>
              <MenuItem value="report">Отчет</MenuItem>
              <MenuItem value="other">Другое</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={staffMembers}
              getOptionLabel={(option) => option.fullName}
              value={staffMembers.find(s => s.id === filterStaff) || null}
              onChange={(event, newValue) => setFilterStaff(newValue?.id || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Сотрудник" 
                  variant="outlined" 
                />
              )}
            />
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
              <MenuItem value="expired">Истёк</MenuItem>
              <MenuItem value="archived">Архивирован</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              setFilterType('');
              setFilterStaff('');
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
                <TableCell>Сотрудник</TableCell>
                <TableCell>Название документа</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Файл</TableCell>
                <TableCell>Дата загрузки</TableCell>
                <TableCell>Срок действия</TableCell>
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
                        <PersonIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {document.staffName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {staffMembers.find(s => s.id === document.staffId)?.position}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
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
                    <TableCell>
                      <Typography variant="body2">{document.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(document.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(document.uploadDate, 'dd.MM.yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      {document.expiryDate ? (
                        <Typography 
                          variant="body2" 
                          color={new Date(document.expiryDate) < new Date() ? 'error' : 'text.primary'}
                        >
                          {format(document.expiryDate, 'dd.MM.yyyy', { locale: ru })}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Без срока
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(document.status)}
                        color={getStatusColor(document.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadDocument(document)}
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
                    <MenuItem value="certificate">Справка</MenuItem>
                    <MenuItem value="report">Отчет</MenuItem>
                    <MenuItem value="other">Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={staffMembers}
                  getOptionLabel={(option) => option.fullName}
                  value={staffMembers.find(s => s.id === currentDocument.staffId) || null}
                  onChange={(event, newValue) => setCurrentDocument({
                    ...currentDocument,
                    staffId: newValue?.id || '',
                    staffName: newValue?.fullName || ''
                  })}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Сотрудник" 
                      variant="outlined" 
                      required
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Дата окончания срока действия"
                  type="date"
                  value={currentDocument.expiryDate ? 
                    format(new Date(currentDocument.expiryDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setCurrentDocument({
                    ...currentDocument,
                    expiryDate: e.target.value ? new Date(e.target.value) : undefined
                  })}
                  InputLabelProps={{ shrink: true }}
                />
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
                    <MenuItem value="expired">Истёк</MenuItem>
                    <MenuItem value="archived">Архивирован</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
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
                        const file = e.target.files?.[0];
                        if (file) {
                          alert(`Выбран файл: ${file.name}`);
                          // В реальном приложении здесь будет загрузка файла
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
                    Перетащите файл сюда или нажмите для выбора
                  </Typography>
                </Box>
              </Grid>
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
    </Box>
  );
};

export default StaffDocuments;
