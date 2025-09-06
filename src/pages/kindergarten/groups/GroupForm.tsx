import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { withRouter } from 'react-router-dom';
import { useGroups } from '../../../context/GroupsContext';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    minWidth: '500px',
    padding: theme.spacing(2, 0),
  },
  formRow: {
    display: 'flex',
    gap: theme.spacing(2),
    '& > *': {
      flex: 1,
    },
  },
  dialogActions: {
    padding: theme.spacing(0, 3, 2, 3),
  },
}));

// Валидационная схема
const validationSchema = Yup.object({
  name: Yup.string().required('Обязательное поле'),
  ageRange: Yup.string().required('Обязательное поле'),
  description: Yup.string(),
  maxCapacity: Yup.number()
    .typeError('Должно быть числом')
    .min(1, 'Минимальное значение: 1')
    .required('Обязательное поле'),
  teacherId: Yup.string(), // воспитатель теперь не обязателен
});

const GroupForm = ({ open, onClose, group = null }) => {
  const classes = useStyles();
  const { createGroup, updateGroup, getTeachers, loading } = useGroups();
  const [teachers, setTeachers] = useState([]);
  const [formError, setFormError] = useState('');

  // Load teachers when the form opens
  useEffect(() => {
    if (open) {
      const loadTeachers = async () => {
        try {
          const teachersList = await getTeachers();
          setTeachers(teachersList);
        } catch (err) {
          console.error('Failed to load teachers:', err);
          setFormError('Не удалось загрузить список воспитателей');
        }
      };
      loadTeachers();
    }
  }, [open, getTeachers]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: group?.name || '',
      ageRange: group?.ageRange || '2-3 года',
      description: group?.description || '',
      maxCapacity: group?.maxCapacity || 20,
      teacherId: group?.teacherId || '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        setFormError('');
        
        if (group) {
          // Update existing group
          await updateGroup(group.id, values);
        } else {
          // Create new group
          await createGroup(values);
        }
        
        onClose();
      } catch (err) {
        console.error('Error saving group:', err);
        setFormError('Произошла ошибка при сохранении группы. Пожалуйста, попробуйте снова.');
        setStatus({ success: false });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <DialogTitle>
          {group ? 'Редактировать группу' : 'Добавить новую группу'}
        </DialogTitle>
        <DialogContent className={classes.form}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Название группы"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            margin="normal"
            disabled={formik.isSubmitting}
          />

          <FormControl 
            fullWidth 
            margin="normal"
            error={formik.touched.ageRange && Boolean(formik.errors.ageRange)}
            disabled={formik.isSubmitting}
          >
            <InputLabel id="age-range-label">Возрастная категория</InputLabel>
            <Select
              labelId="age-range-label"
              id="ageRange"
              name="ageRange"
              value={formik.values.ageRange}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="Возрастная категория"
            >
              <MenuItem value="2-3 года">2-3 года</MenuItem>
              <MenuItem value="3-4 года">3-4 года</MenuItem>
              <MenuItem value="4-5 лет">4-5 лет</MenuItem>
              <MenuItem value="5-6 лет">5-6 лет</MenuItem>
              <MenuItem value="6-7 лет">6-7 лет</MenuItem>
            </Select>
            {formik.touched.ageRange && formik.errors.ageRange && (
              <Typography color="error" variant="caption">
                {formik.errors.ageRange}
              </Typography>
            )}
          </FormControl>

          <FormControl 
            fullWidth 
            margin="normal"
            error={formik.touched.teacherId && Boolean(formik.errors.teacherId)}
            disabled={formik.isSubmitting}
          >
            <InputLabel id="teacher-label">Воспитатель</InputLabel>
            <Select
              labelId="teacher-label"
              id="teacherId"
              name="teacherId"
              value={formik.values.teacherId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="Воспитатель"
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
              {teachers.length === 0 && (
                <MenuItem disabled>Нет доступных воспитателей</MenuItem>
              )}
            </Select>
            {formik.touched.teacherId && formik.errors.teacherId && (
              <Typography color="error" variant="caption">
                {formik.errors.teacherId}
              </Typography>
            )}
          </FormControl>

          <TextField
            fullWidth
            id="maxCapacity"
            name="maxCapacity"
            label="Максимальное количество детей"
            type="number"
            value={formik.values.maxCapacity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.maxCapacity && Boolean(formik.errors.maxCapacity)}
            helperText={formik.touched.maxCapacity && formik.errors.maxCapacity}
            margin="normal"
            InputProps={{ 
              inputProps: { min: 1, max: 50 },
              disabled: formik.isSubmitting
            }}
          />

          <TextField
            fullWidth
            id="description"
            name="description"
            label="Описание (необязательно)"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            margin="normal"
            multiline
            rows={3}
            disabled={formik.isSubmitting}
          />
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button 
            onClick={onClose} 
            color="primary" 
            disabled={formik.isSubmitting}
          >
            Отмена
          </Button>
          <Button
            color="primary"
            variant="contained"
            type="submit"
            disabled={!formik.isValid || formik.isSubmitting || loading}
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} />
            ) : group ? (
              'Сохранить изменения'
            ) : (
              'Создать группу'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default withRouter(GroupForm);
