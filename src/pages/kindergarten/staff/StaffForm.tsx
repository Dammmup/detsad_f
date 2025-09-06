import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useStaff } from '../../../context/StaffContext';
import { useGroups } from '../../../context/GroupsContext';
import { makeStyles } from '@mui/styles';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  FormControlLabel,
  Switch,
  FormGroup,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  CameraAlt as CameraAltIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    '& h1': {
      marginLeft: theme.spacing(2),
    },
  },
  formContainer: {
    marginTop: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  avatar: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    margin: theme.spacing(3, 0, 2, 0),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  actionButtons: {
    marginTop: theme.spacing(3),
    '& > *': {
      marginRight: theme.spacing(2),
    },
  },
}));

// Валидационная схема
const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Обязательное поле')
    .min(3, 'Минимум 3 символа')
    .max(100, 'Максимум 100 символов'),
  phone: Yup.string()
    .matches(
      /^\+?[0-9\s-()]+$/,
      'Некорректный формат номера телефона'
    )
    .required('Обязательное поле'),
  whatsapp: Yup.string()
    .matches(
      /^\+?[0-9\s-()]+$/,
      'Некорректный формат WhatsApp номера'
    ),
  iin: Yup.string()
    .matches(
      /^[0-9]{12}$/,
      'ИИН должен состоять из 12 цифр'
    ),
  birthday: Yup.date(),
  role: Yup.string().required('Выберите роль'),
  groupId: Yup.string().when('role', {
    is: (role) => ['teacher', 'assistant'].includes(role),
    then: Yup.string().required('Выберите группу'),
  }),
  salary: Yup.number().min(0, 'Зарплата не может быть отрицательной'),
  isActive: Yup.boolean(),
  notes: Yup.string().max(500, 'Максимум 500 символов'),
});

const StaffForm = () => {
  const classes = useStyles();
  const history = useHistory();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const {
    currentStaff,
    loading,
    error,
    fetchStaffMember,
    addStaff,
    updateStaff,
    roles,
    fetchRoles,
  } = useStaff();

  const {
    groups,
    loading: groupsLoading,
    fetchGroups,
  } = useGroups();

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Загрузка данных сотрудника при редактировании
  useEffect(() => {
    if (isEditMode) {
      fetchStaffMember(id);
    }
    // Загрузка списка ролей и групп
    fetchRoles();
    fetchGroups();
  }, [id, isEditMode, fetchStaffMember, fetchRoles, fetchGroups]);

  // Установка предпросмотра аватара при загрузке существующего сотрудника
  useEffect(() => {
    if (isEditMode && currentStaff?.avatar) {
      setAvatarPreview(currentStaff.avatar);
    }
  }, [currentStaff, isEditMode]);

  const formik = useFormik({
    initialValues: {
      fullName: currentStaff?.fullName || '',
      phone: currentStaff?.phone || '',
      whatsapp: currentStaff?.whatsapp || currentStaff?.phone || '',
      iin: currentStaff?.uniqNumber || '', // ИИН из базы данных
      birthday: currentStaff?.birthday ? new Date(currentStaff.birthday).toISOString().split('T')[0] : '',
      role: currentStaff?.role || '',
      groupId: currentStaff?.groupId || '',
      salary: currentStaff?.salary || '',
      isActive: currentStaff?.active ?? true,
      notes: currentStaff?.notes || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        console.log('Отправляемые данные формы:', values);
        
        // Подготавливаем данные для отправки в JSON формате
        const staffData = {
          fullName: values.fullName,
          phone: values.phone,
          whatsapp: values.whatsapp || values.phone, // WhatsApp номер или телефон
          iin: values.iin || null, // ИИН (Индивидуальный идентификационный номер)
          birthday: values.birthday || new Date().toISOString().split('T')[0],
          type: 'adult', // Сотрудники - взрослые
          role: values.role,
          groupId: values.groupId || null,
          salary: values.salary ? parseFloat(values.salary) : null,
          active: values.isActive,
          notes: values.notes || '',
        };
        
        console.log('Данные для API:', staffData);

        if (isEditMode) {
          await updateStaff(id, staffData);
        } else {
          await addStaff(staffData);
        }
        
        // Перенаправляем на список сотрудников после успешного сохранения
        history.push('/app/kindergarten/staff');
      } catch (error) {
        console.error('Ошибка при сохранении сотрудника:', error);
      }
    },
  });

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    history.push('/app/kindergarten/staff');
  };

  if (isEditMode && loading && !currentStaff) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isEditMode && error && !currentStaff) {
    return (
      <div className={classes.root}>
        <Alert severity="error">Ошибка при загрузке данных сотрудника: {error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Назад к списку
        </Button>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Редактирование сотрудника' : 'Новый сотрудник'}
        </Typography>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper className={classes.paper}>
              <div className={classes.avatarContainer}>
                <Avatar
                  src={avatarPreview}
                  className={classes.avatar}
                  sx={{ width: 120, height: 120 }}
                >
                  <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CameraAltIcon />}
                  >
                    {avatarPreview ? 'Изменить фото' : 'Загрузить фото'}
                  </Button>
                </label>
              </div>

              <FormControl
                fullWidth
                margin="normal"
                error={formik.touched.role && Boolean(formik.errors.role)}
              >
                <InputLabel id="role-label">Роль *</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Роль *"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <FormHelperText>{formik.errors.role}</FormHelperText>
                )}
              </FormControl>

              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formik.values.isActive}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Активный сотрудник"
                />
              </FormGroup>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Основная информация
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="fullName"
                    name="fullName"
                    label="ФИО *"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                    helperText={formik.touched.fullName && formik.errors.fullName}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="whatsapp"
                    name="whatsapp"
                    label="WhatsApp"
                    value={formik.values.whatsapp}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.whatsapp && Boolean(formik.errors.whatsapp)}
                    helperText={formik.touched.whatsapp && formik.errors.whatsapp}
                    margin="normal"
                    placeholder="+7 XXX XXX XXXX"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="iin"
                    name="iin"
                    label="ИИН (Индивидуальный идентификационный номер)"
                    value={formik.values.iin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.iin && Boolean(formik.errors.iin)}
                    helperText={formik.touched.iin && formik.errors.iin}
                    margin="normal"
                    placeholder="123456789012"
                    inputProps={{
                      maxLength: 12,
                      pattern: "[0-9]*"
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="birthday"
                    name="birthday"
                    label="Дата рождения"
                    type="date"
                    value={formik.values.birthday}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.birthday && Boolean(formik.errors.birthday)}
                    helperText={formik.touched.birthday && formik.errors.birthday}
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="salary"
                    name="salary"
                    label="Зарплата (тенге)"
                    type="number"
                    value={formik.values.salary}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.salary && Boolean(formik.errors.salary)}
                    helperText={formik.touched.salary && formik.errors.salary}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label="Телефон *"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    margin="normal"
                  />
                </Grid>
                {formik.values.role && ['teacher', 'assistant'].includes(formik.values.role) && (
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      error={formik.touched.groupId && Boolean(formik.errors.groupId)}
                    >
                      <InputLabel id="group-label">Группа *</InputLabel>
                      <Select
                        labelId="group-label"
                        id="groupId"
                        name="groupId"
                        value={formik.values.groupId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Группа *"
                      >
                        <MenuItem value="">
                          <em>Не выбрано</em>
                        </MenuItem>
                        {groups.map((group) => (
                          <MenuItem key={group._id} value={group._id}>
                            {group.name} ({group.ageGroup})
                          </MenuItem>
                        ))}
                        {groupsLoading && (
                          <MenuItem disabled>
                            <em>Загрузка...</em>
                          </MenuItem>
                        )}
                      </Select>
                      {formik.touched.groupId && formik.errors.groupId && (
                        <FormHelperText>{formik.errors.groupId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" className={classes.sectionTitle} style={{ marginTop: '2rem' }}>
                Дополнительная информация
              </Typography>

              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Заметки"
                multiline
                rows={4}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
                margin="normal"
                variant="outlined"
              />

              <Divider sx={{ my: 3 }} />

              <div className={classes.actionButtons}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Отмена
                </Button>
              </div>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default StaffForm;
