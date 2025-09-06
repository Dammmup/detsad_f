import React from 'react';
import { Button, TextField, Grid, Box } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  fullName: Yup.string().required('Обязательное поле'),
  birthday: Yup.date().required('Обязательное поле'),
  parentName: Yup.string().required('Имя родителя обязательно'),
  parentPhone: Yup.string()
    .matches(/^\+?[0-9\s-()]+$/, 'Некорректный формат номера')
    .required('Телефон родителя обязателен'),
});

const ChildForm = ({ onSuccess }) => {
  const formik = useFormik({
    initialValues: {
      fullName: '',
      birthday: '',
      parentName: '',
      parentPhone: '',
    },
    validationSchema,
    onSubmit: (values) => {
      // TODO: интеграция с API для создания ребенка
      // await addChild(values);
      if (onSuccess) onSuccess();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="fullName"
            name="fullName"
            label="ФИО ребенка"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.fullName && Boolean(formik.errors.fullName)}
            helperText={formik.touched.fullName && formik.errors.fullName}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
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
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="parentName"
            name="parentName"
            label="Имя родителя"
            value={formik.values.parentName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.parentName && Boolean(formik.errors.parentName)}
            helperText={formik.touched.parentName && formik.errors.parentName}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="parentPhone"
            name="parentPhone"
            label="Телефон родителя (WhatsApp)"
            value={formik.values.parentPhone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.parentPhone && Boolean(formik.errors.parentPhone)}
            helperText={formik.touched.parentPhone && formik.errors.parentPhone}
            margin="normal"
            placeholder="+7 XXX XXX XXXX"
          />
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button color="primary" variant="contained" type="submit">
              Сохранить
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default ChildForm;
