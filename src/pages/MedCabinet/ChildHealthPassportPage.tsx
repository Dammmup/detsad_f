import React from 'react';
import { Box, Typography, Paper, Button, MenuItem, TextField, Stack, Divider, CircularProgress } from '@mui/material';
import { getUsers } from '../../services/api/users';
import { User } from '../../types/common';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import childrenApi from '../../services/api/children';

// Типы для формы
interface ChildPassportForm {
  fio: string;
  iin: string;
  birthdate: string;
  gender: string;
  address: string;
  clinic: string;
  bloodGroup: string;
  rhesus: string;
  disability: string;
  dispensary: string;
  diagnosis: string;
  allergy: string;
  infections: string;
  hospitalizations: string;
  incapacity: string;
  checkups: string;
}



export default function ChildHealthPassportPage() {
  const [selectedId, setSelectedId] = React.useState('');
  const [children, setChildren] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<ChildPassportForm>({
    fio: '', iin: '', birthdate: '', gender: '', address: '',
    clinic: '', bloodGroup: '', rhesus: '', disability: '', dispensary: '', diagnosis: '',
    allergy: '', infections: '', hospitalizations: '', incapacity: '', checkups: '',
  });

  React.useEffect(() => {
    setLoading(true);
    childrenApi.getAll()
      .then(users => {
        setChildren(users);
      })
      .finally(() => setLoading(false));
  }, []);

  // При выборе ребенка автозаполняем основные поля
  React.useEffect(() => {
    const child = children.find(c => c.id === selectedId || c._id === selectedId);
    if (child) {
      setForm(f => ({
        ...f,
        fio: child.fullName || '',
        iin: child.iin || '',
        birthdate: child.birthday || '',
        gender: '', // В базе нет поля gender, оставляем пустым или реализуем определение по notes
        address: child.notes || '', // или child.address если есть
      }));
    }
  }, [selectedId, children]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };


  // Экспорт в Word (docx)
  const handleExport = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Паспорт здоровья ребенка (форма 052-2/у)',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),
            new Paragraph({ text: `ФИО: ${form.fio}` }),
            new Paragraph({ text: `ИИН: ${form.iin}` }),
            new Paragraph({ text: `Дата рождения: ${form.birthdate}` }),
            new Paragraph({ text: `Пол: ${form.gender}` }),
            new Paragraph({ text: `Домашний адрес: ${form.address}` }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Общая медицинская информация', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `Поликлиника прикрепления: ${form.clinic}` }),
            new Paragraph({ text: `Группа крови: ${form.bloodGroup}` }),
            new Paragraph({ text: `Резус фактор: ${form.rhesus}` }),
            new Paragraph({ text: `Группа инвалидности: ${form.disability}` }),
            new Paragraph({ text: `Диспансерный отчет: ${form.dispensary}` }),
            new Paragraph({ text: `Диагноз: ${form.diagnosis}` }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Аллергоанамнез', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: form.allergy }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Перенесенные инфекционные заболевания', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: form.infections }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Госпитализации', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: form.hospitalizations }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Временная нетрудоспособность', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: form.incapacity }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Профилактические осмотры', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: form.checkups }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Паспорт_здоровья_${form.fio || 'ребенок'}.docx`);
    });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 700, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 1, md: 3 } }}>
        <Typography variant="h5" gutterBottom>Паспорт здоровья ребенка (форма 052-2/у)</Typography>
        <Stack spacing={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TextField
              select
              label="Выберите ребенка"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {children.map(child => (
                <MenuItem key={child.id || child._id} value={child.id || child._id}>{child.fullName}</MenuItem>
              ))}
            </TextField>
          )}
          <Divider>Основная информация</Divider>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="ФИО" name="fio" value={form.fio} onChange={handleChange} fullWidth />
            <TextField label="ИИН" name="iin" value={form.iin} onChange={handleChange} fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Дата рождения" name="birthdate" value={form.birthdate} onChange={handleChange} fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Пол" name="gender" value={form.gender} onChange={handleChange} fullWidth />
          </Stack>
          <TextField label="Домашний адрес" name="address" value={form.address} onChange={handleChange} fullWidth />
          <Divider>Общая медицинская информация</Divider>
          <TextField label="Поликлиника прикрепления" name="clinic" value={form.clinic} onChange={handleChange} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Группа крови" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} fullWidth />
            <TextField label="Резус фактор" name="rhesus" value={form.rhesus} onChange={handleChange} fullWidth />
          </Stack>
          <TextField label="Группа инвалидности (если есть)" name="disability" value={form.disability} onChange={handleChange} fullWidth />
          <TextField label="Диспансерный отчет" name="dispensary" value={form.dispensary} onChange={handleChange} fullWidth />
          <TextField label="Диагноз" name="diagnosis" value={form.diagnosis} onChange={handleChange} fullWidth />
          <Divider>Аллергоанамнез</Divider>
          <TextField label="Аллергоанамнез" name="allergy" value={form.allergy} onChange={handleChange} fullWidth multiline minRows={2} />
          <Divider>Перенесенные инфекционные заболевания</Divider>
          <TextField label="Инфекции" name="infections" value={form.infections} onChange={handleChange} fullWidth multiline minRows={2} />
          <Divider>Госпитализации</Divider>
          <TextField label="Госпитализации" name="hospitalizations" value={form.hospitalizations} onChange={handleChange} fullWidth multiline minRows={2} />
          <Divider>Временная нетрудоспособность</Divider>
          <TextField label="Временная нетрудоспособность" name="incapacity" value={form.incapacity} onChange={handleChange} fullWidth multiline minRows={2} />
          <Divider>Профилактические осмотры</Divider>
          <TextField label="Профосмотры" name="checkups" value={form.checkups} onChange={handleChange} fullWidth multiline minRows={2} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" onClick={handleExport}>Скачать в Word</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
