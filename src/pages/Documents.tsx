import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  formatFileSize,
  getFileIcon,
  getTypeText,
  getCategoryText,
} from '../utils/documentUtils';
import { ru } from 'date-fns/locale';
import { Document as DocumentType } from '../types/documents';
import { getStatusColor } from '../utils/format';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from '../services/documents';

// 🇷🇺 Переводы ролей с английского на русский
const roleTranslations: Record<string, string> = {
  // Административные роли
  admin: 'Администратор',
  manager: 'Менеджер',
  director: 'Директор',

  // Педагогические роли
  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  psychologist: 'Психолог',
  speech_therapist: 'Логопед',
  music_teacher: 'Музыкальный руководитель',
  physical_education: 'Инструктор по физкультуре',

  // Медицинские роли
  nurse: 'Медсестра',
  doctor: 'Врач',

  // Обслуживающий персонал
  cook: 'Повар',
  cleaner: 'Уборщица',
  security: 'Охранник',
  maintenance: 'Завхоз',
  laundry: 'Прачка',

  // Дополнительные роли
  staff: 'Сотрудник',
  substitute: 'Подменный сотрудник',
  intern: 'Стажер',
};

export const Documents = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>(
    [],
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDocument, setCurrentDocument] =
    useState<Partial<DocumentType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterName, setFilterName] = useState<string>('');

  // Загрузка данных с бэкенда
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Загрузка документов
        const documentsData = await getDocuments();
        setDocuments(documentsData.items || documentsData);
        setFilteredDocuments(documentsData.items || documentsData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Не удалось загрузить данные документов');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Применение фильтров
  useEffect(() => {
    let filtered = [...documents];

    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Фильтр по типу
    if (filterType) {
      filtered = filtered.filter((doc) => doc.type === filterType);
    }

    // Фильтр по категории
    if (filterCategory) {
      filtered = filtered.filter((doc) => doc.category === filterCategory);
    }

    // Фильтр по статусу
    if (filterStatus) {
      filtered = filtered.filter((doc) => doc.status === filterStatus);
    }

    // Фильтр по имени (только для категории "staff")
    if (filterName && filterCategory === 'staff') {
      const name = filterName.toLowerCase();
      filtered = filtered.filter((doc) => {
        const uploaderName = doc.uploader?.fullName?.toLowerCase() || '';
        return uploaderName.includes(name);
      });
    }

    // Фильтр по роли (только для категории "staff")
    if (filterRole.length > 0 && filterCategory === 'staff') {
      filtered = filtered.filter((doc) => {
        const uploaderId = doc.uploader?.id;
        if (!uploaderId) return false;
        // Skip the role filter for staff since staffList is not available
        return true;
      });
    }

    setFilteredDocuments(filtered);
    setPage(0); // Сброс на первую страницу при изменении фильтров
  }, [
    documents,
    searchTerm,
    filterType,
    filterCategory,
    filterStatus,
    filterRole,
    filterName,
  ]);

  const handleOpenDialog = (document?: DocumentType) => {
    setCurrentDocument(
      document || {
        title: '',
        type: 'other',
        category: 'other',
        status: 'active',
        tags: [],
      },
    );
    setFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDocument(null);
    setFile(null);
  };

  const handleSaveDocument = async () => {
    if (!currentDocument) return;

    try {
      if (currentDocument.id) {
        // Редактирование существующего документа
        const updatedDocument = await updateDocument(currentDocument.id, {
          title: currentDocument.title,
          description: currentDocument.description,
          type: currentDocument.type,
          category: currentDocument.category,
          status: currentDocument.status,
          tags: currentDocument.tags,
        });

        setDocuments(
          documents.map((doc) =>
            doc.id === currentDocument.id ? updatedDocument : doc,
          ),
        );
        setFilteredDocuments(
          filteredDocuments.map((doc) =>
            doc.id === currentDocument.id ? updatedDocument : doc,
          ),
        );
      } else {
        // Добавление нового документа
        if (!file) {
          setError('Пожалуйста, выберите файл документа');
          return;
        }

        const documentData = {
          title: currentDocument.title || file.name,
          description: currentDocument.description,
          type: currentDocument.type as any,
          category: currentDocument.category as any,
          file: file,
          tags: currentDocument.tags || [],
          status: currentDocument.status || 'active',
        };

        const newDocument = await createDocument(documentData);
        setDocuments([...documents, newDocument]);
        setFilteredDocuments([...filteredDocuments, newDocument]);
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
        await deleteDocument(id);
        setDocuments(
          documents.filter((doc) =>
            (doc.id || doc._id) === id ? false : true,
          ),
        );
        setFilteredDocuments(
          filteredDocuments.filter((doc) =>
            (doc.id || doc._id) === id ? false : true,
          ),
        );
      } catch (error) {
        console.error('Ошибка удаления документа:', error);
        setError('Не удалось удалить документ');
      }
    }
  };

  const handleDownloadDocument = async (id: string) => {
    try {
      console.log('Downloading document with ID:', id);
      await downloadDocument(id);
    } catch (error) {
      console.error('Ошибка скачивания документа:', error);
      setError('Не удалось скачать документ');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box
        p={3}
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='200px'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant='contained' onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h5' gutterBottom>
          Документы
        </Typography>
        <Box>
          <Button
            variant='contained'
            color='primary'
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Добавить документ
          </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display='flex' flexWrap='wrap' gap={2} alignItems='center'>
          <TextField
            label='Поиск'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 20 }} />,
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Тип</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label='Тип'
            >
              <MenuItem value=''>Все типы</MenuItem>
              <MenuItem value='contract'>Договор</MenuItem>
              <MenuItem value='report'>Отчет</MenuItem>
              <MenuItem value='certificate'>Справка</MenuItem>
              <MenuItem value='policy'>Политика</MenuItem>
              <MenuItem value='other'>Другое</MenuItem>
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Категория</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label='Категория'
            >
              <MenuItem value=''>Все категории</MenuItem>
              <MenuItem value='staff'>Сотрудники</MenuItem>
              <MenuItem value='children'>Дети</MenuItem>
              <MenuItem value='financial'>Финансы</MenuItem>
              <MenuItem value='administrative'>Администрация</MenuItem>
              <MenuItem value='other'>Другое</MenuItem>
            </Select>
          </FormControl>

          {/* Фильтр по имени (только для категории "staff") */}
          {filterCategory === 'staff' && (
            <TextField
              label='Поиск по имени'
              variant='outlined'
              size='small'
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          )}

          {/* Фильтр по роли (только для категории "staff") */}
          {filterCategory === 'staff' && (
            <FormControl size='small' sx={{ minWidth: '200px' }}>
              <InputLabel id='role-filter-label'>
                Фильтр по должности
              </InputLabel>
              <Select
                labelId='role-filter-label'
                multiple
                value={filterRole}
                onChange={(event: SelectChangeEvent<string[]>) => {
                  const { value } = event.target;
                  setFilterRole(
                    typeof value === 'string' ? value.split(',') : value,
                  );
                }}
                input={<OutlinedInput label='Фильтр по должности' />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size='small' />
                    ))}
                  </Box>
                )}
              >
                {Object.values(roleTranslations)
                  .sort()
                  .map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={filterRole.indexOf(role) > -1} />
                      <ListItemText primary={role} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label='Статус'
            >
              <MenuItem value=''>Все статусы</MenuItem>
              <MenuItem value='active'>Активен</MenuItem>
              <MenuItem value='archived'>Архивирован</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant='outlined'
            startIcon={<FilterIcon />}
            onClick={() => {
              setFilterType('');
              setFilterCategory('');
              setFilterStatus('');
              setSearchTerm('');
              setFilterRole([]);
              setFilterName('');
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
                <TableCell align='right'>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((document) => (
                  <TableRow key={document.id || document._id}>
                    <TableCell>
                      <Box display='flex' alignItems='center'>
                        {getFileIcon(document.fileName)}
                        <Box ml={1}>
                          <Typography variant='body2' fontWeight='bold'>
                            {document.title}
                          </Typography>
                          <Box
                            display='flex'
                            flexWrap='wrap'
                            gap={0.5}
                            mt={0.5}
                          >
                            {document.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size='small'
                                variant='outlined'
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
                      <Typography variant='body2'>
                        {document.fileName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatFileSize(document.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {document.uploadDate
                        ? format(new Date(document.uploadDate), 'dd.MM.yyyy', {
                            locale: ru,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>{document.uploader?.fullName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          document.status === 'active'
                            ? 'Активен'
                            : 'Архивирован'
                        }
                        color={getStatusColor(document.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Скачать'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            console.log(
                              'Download button clicked, document:',
                              document,
                            );
                            const docId = document.id || document._id;
                            if (docId) {
                              handleDownloadDocument(docId);
                            } else {
                              console.error('Document ID is missing');
                              setError(
                                'Не удалось скачать документ: отсутствует ID',
                              );
                            }
                          }}
                        >
                          <DownloadIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Редактировать'>
                        <IconButton
                          size='small'
                          onClick={() => handleOpenDialog(document)}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Удалить'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            const docId = document.id || document._id;
                            if (docId) {
                              handleDeleteDocument(docId);
                            } else {
                              console.error(
                                'Document ID is missing for delete',
                              );
                              setError(
                                'Не удалось удалить документ: отсутствует ID',
                              );
                            }
                          }}
                          color='error'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredDocuments.length === 0 && (
          <Box p={4} textAlign='center'>
            <Typography variant='h6' color='text.secondary'>
              Нет документов
            </Typography>
            <Typography variant='body2' color='text.secondary' mt={1}>
              Создайте документ из шаблона или загрузите новый файл
            </Typography>
            <Box mt={2}>
              <Button
                variant='contained'
                color='primary'
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
          component='div'
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage='Строк на странице:'
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`
          }
        />
      </Paper>

      {/* Диалог редактирования/создания документа */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {currentDocument?.id ? 'Редактировать документ' : 'Добавить документ'}
        </DialogTitle>
        <DialogContent dividers>
          {currentDocument && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Название документа'
                  value={currentDocument.title || ''}
                  onChange={(e) =>
                    setCurrentDocument({
                      ...currentDocument,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Описание'
                  multiline
                  rows={3}
                  value={currentDocument.description || ''}
                  onChange={(e) =>
                    setCurrentDocument({
                      ...currentDocument,
                      description: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип документа</InputLabel>
                  <Select
                    value={currentDocument.type || ''}
                    onChange={(e) =>
                      setCurrentDocument({
                        ...currentDocument,
                        type: e.target.value as any,
                      })
                    }
                    label='Тип документа'
                  >
                    <MenuItem value='contract'>Договор</MenuItem>
                    <MenuItem value='report'>Отчет</MenuItem>
                    <MenuItem value='certificate'>Справка</MenuItem>
                    <MenuItem value='policy'>Политика</MenuItem>
                    <MenuItem value='other'>Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Категория</InputLabel>
                  <Select
                    value={currentDocument.category || ''}
                    onChange={(e) =>
                      setCurrentDocument({
                        ...currentDocument,
                        category: e.target.value as any,
                      })
                    }
                    label='Категория'
                  >
                    <MenuItem value='staff'>Сотрудники</MenuItem>
                    <MenuItem value='children'>Дети</MenuItem>
                    <MenuItem value='financial'>Финансы</MenuItem>
                    <MenuItem value='administrative'>Администрация</MenuItem>
                    <MenuItem value='other'>Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    value={currentDocument.status || ''}
                    onChange={(e) =>
                      setCurrentDocument({
                        ...currentDocument,
                        status: e.target.value as any,
                      })
                    }
                    label='Статус'
                  >
                    <MenuItem value='active'>Активен</MenuItem>
                    <MenuItem value='archived'>Архивирован</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Теги (через запятую)'
                  value={currentDocument.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setCurrentDocument({
                      ...currentDocument,
                      tags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                />
              </Grid>

              {!currentDocument.id && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    p={2}
                    border='1px dashed #ccc'
                    borderRadius={1}
                  >
                    <Button
                      variant='outlined'
                      startIcon={<UploadIcon />}
                      component='label'
                    >
                      Выбрать файл
                      <input
                        type='file'
                        hidden
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) {
                            setFile(selectedFile);
                          }
                        }}
                      />
                    </Button>
                    <Typography
                      variant='body2'
                      sx={{ ml: 2 }}
                      color='text.secondary'
                    >
                      {file
                        ? file.name
                        : 'Перетащите файл сюда или нажмите для выбора'}
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
            variant='contained'
            color='primary'
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
