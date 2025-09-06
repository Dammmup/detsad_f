import React from 'react';
import {
    Grid,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import Axios from 'axios';
import config from '../../config';
import { Button, Typography } from '../../components/Wrappers';
import Widget from '../../components/Widget';
import Notification from "../../components/Notification";
import { useGroups } from '../../context/GroupsContext';
import useStyles from './styles';

const AddUser = () => {
    const history = useHistory();
    const classes = useStyles();
    const { groups, loading: groupsLoading, fetchGroups } = useGroups();
    
    // Начальное состояние формы
    const [formData, setFormData] = React.useState({
        fullName: '',
        phone: '', // WhatsApp номер для входа
        type: 'adult', // adult или child
        role: '',
        birthday: '',
        notes: '',
        active: true,
        // Поля для сотрудников
        salary: '',
        // Поля для детей
        parentName: '',
        parentPhone: '',
        groupId: '',
    });

    // Состояние для ошибок валидации
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        // Загружаем группы при монтировании компонента
        if (groups.length === 0) {
            fetchGroups();
        }
    }, [groups.length, fetchGroups]);

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Очищаем ошибку при изменении поля
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Валидация формы
    const validate = () => {
        const newErrors = {};
        
        // Базовые обязательные поля для всех
        const baseRequiredFields = ['fullName', 'phone', 'type'];
        
        baseRequiredFields.forEach(field => {
            if (!formData[field]?.toString().trim()) {
                newErrors[field] = 'Обязательное поле';
            }
        });
        
        // Валидация роли в зависимости от типа
        if (formData.type === 'adult') {
            if (!formData.role || formData.role === 'child') {
                newErrors.role = 'Выберите роль для сотрудника';
            }
        } else if (formData.type === 'child') {
            // Для детей роль автоматически 'child'
            // Проверяем обязательные поля для детей
            if (!formData.parentName?.trim()) {
                newErrors.parentName = 'Имя родителя обязательно для детей';
            }
            if (!formData.parentPhone?.trim()) {
                newErrors.parentPhone = 'WhatsApp родителя обязателен для детей';
            }
            if (!formData.groupId) {
                newErrors.groupId = 'Группа обязательна для детей';
            }
        }
        
        // Валидация формата телефона
        const phoneRegex = /^[0-9+\s()-]+$/;
        if (formData.phone) {
            if (!phoneRegex.test(formData.phone)) {
                newErrors.phone = 'Неверный формат WhatsApp номера. Допустимы цифры, пробелы, +, - и скобки';
            } else if (formData.phone.replace(/[^0-9+]/g, '').length < 10) {
                newErrors.phone = 'WhatsApp номер слишком короткий';
            }
        }
        
        // Валидация WhatsApp родителя для детей
        if (formData.type === 'child' && formData.parentPhone) {
            if (!phoneRegex.test(formData.parentPhone)) {
                newErrors.parentPhone = 'Неверный формат WhatsApp номера родителя';
            } else if (formData.parentPhone.replace(/[^0-9+]/g, '').length < 10) {
                newErrors.parentPhone = 'WhatsApp номер родителя слишком короткий';
            }
        }
        
        // Валидация зарплаты для сотрудников
        if (formData.type === 'adult' && formData.salary && isNaN(Number(formData.salary))) {
            newErrors.salary = 'Зарплата должна быть числом';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) {
            toast.error('Пожалуйста, проверьте правильность заполнения всех полей');
            return;
        }

        setLoading(true);
        
        try {
            // Проверяем наличие всех обязательных полей перед отправкой
            if (!formData.phone || !formData.fullName || !formData.type) {
                throw new Error('Не все обязательные поля заполнены');
            }

            // Подготавливаем данные для отправки
            const userData = {
                // Базовые обязательные поля
                fullName: formData.fullName.trim(),
                phone: formData.phone.replace(/[^0-9+]/g, ''), // WhatsApp номер
                type: formData.type, // 'adult' или 'child'
                
                // Общие поля
                birthday: formData.birthday || null,
                notes: formData.notes?.trim() || null,
                active: formData.active !== undefined ? formData.active : true,
            };
            
            // Поля в зависимости от типа пользователя
            if (formData.type === 'adult') {
                // Для сотрудников
                userData.role = formData.role;
                userData.salary = formData.salary ? Number(formData.salary) : 0;
            } else if (formData.type === 'child') {
                // Для детей
                userData.role = 'child';
                userData.parentName = formData.parentName.trim();
                userData.parentPhone = formData.parentPhone.replace(/[^0-9+]/g, '');
                userData.groupId = formData.groupId;
            }
            
            // Удаляем пустые строки, заменяем на null
            Object.keys(userData).forEach(key => {
                if (userData[key] === '') {
                    userData[key] = null;
                }
            });
            
            console.log('Отправка данных пользователя:', JSON.stringify(userData, null, 2));
            console.log('URL запроса:', `${config.baseURLApi}/users`);

            // Отправляем запрос с таймаутом
            const response = await Axios.post(`${config.baseURLApi}/users`, userData, {
                timeout: 10000, // 10 секунд таймаут
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Ответ сервера:', response.data);
            
            toast.success('Пользователь успешно создан!');
            // Перенаправляем на страницу списка пользователей
            history.push('/app/users');
            
        } catch (error) {
            console.error('Ошибка при создании пользователя:', error);
            
            if (error.response) {
                if (error.response.status === 409) {
                    toast.error('Пользователь с такими данными уже существует');
                } else if (error.response.status === 400 && error.response.data.missingFields) {
                    const missingFields = error.response.data.missingFields;
                    const fieldNames = {
                        password: 'Пароль',
                        fullName: 'Полное имя',
                        phone: 'Телефон'
                    };
                    const errorMessage = `Не заполнены обязательные поля: ${missingFields.map(field => fieldNames[field] || field).join(', ')}`;
                    toast.error(errorMessage);
                } else {
                    toast.error(error.response.data.error || 'Произошла ошибка при создании пользователя');
                }
            } else {
                toast.error('Не удалось подключиться к серверу');
            }
        } finally {
            setLoading(false);
        }
    };

    // Функция для отображения уведомлений
    const showNotification = (message, type = 'info') => {
        const componentProps = {
            type,
            message,
            variant: 'contained',
            color: type === 'error' ? 'secondary' : 'success'
        };
        const options = {
            type,
            position: toast.POSITION.TOP_RIGHT,
            progressClassName: classes.progress,
            className: classes.notification,
            timeOut: 3000
        };
        
        toast(
            <Notification {...componentProps} className={classes.notificationComponent} />,
            options
        );
    };
    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Widget title="Добавление сотрудника" disableWidgetMenu>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Тип пользователя */}
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.type}>
                                    <InputLabel id="type-label">Тип пользователя *</InputLabel>
                                    <Select
                                        labelId="type-label"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        label="Тип пользователя *"
                                        required
                                    >
                                        <MenuItem value="adult">Сотрудник</MenuItem>
                                        <MenuItem value="child">Ребенок</MenuItem>
                                    </Select>
                                    {errors.type && (
                                        <FormHelperText error>{errors.type}</FormHelperText>
                                    )}
                                    <FormHelperText>
                                        Выберите тип: сотрудник для взрослых или ребенок для детей
                                    </FormHelperText>
                                </FormControl>
                            </Grid>

                            {/* Основная информация */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Полное имя *"
                                    name="fullName"
                                    value={formData.fullName || ''}
                                    onChange={handleChange}
                                    variant="outlined"
                                    error={!!errors.fullName}
                                    helperText={errors.fullName || (
                                        formData.type === 'adult' ? 'Полное имя сотрудника' : 'Полное имя ребенка'
                                    )}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="WhatsApp номер *"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    variant="outlined"
                                    error={!!errors.phone}
                                    helperText={errors.phone || (
                                        formData.type === 'adult' ? 'Номер для входа в систему (+7XXXXXXXXXX)' : 'Номер ребенка (+7XXXXXXXXXX)'
                                    )}
                                    margin="normal"
                                    required
                                    inputProps={{
                                        inputMode: 'tel'
                                    }}
                                />
                            </Grid>

                            {/* Поля для сотрудников */}
                            {formData.type === 'adult' && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.role}>
                                            <InputLabel id="role-label">Роль *</InputLabel>
                                            <Select
                                                labelId="role-label"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                label="Роль *"
                                                required
                                            >
                                                <MenuItem value="admin">Администратор</MenuItem>
                                                <MenuItem value="manager">Заведующий</MenuItem>
                                                <MenuItem value="teacher">Воспитатель</MenuItem>
                                                <MenuItem value="assistant">Помощник воспитателя</MenuItem>
                                                <MenuItem value="cook">Повар</MenuItem>
                                                <MenuItem value="cleaner">Уборщик</MenuItem>
                                                <MenuItem value="security">Охранник</MenuItem>
                                                <MenuItem value="nurse">Медсестра</MenuItem>
                                            </Select>
                                            {errors.role && (
                                                <FormHelperText error>{errors.role}</FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Зарплата"
                                            name="salary"
                                            type="number"
                                            value={formData.salary || ''}
                                            onChange={handleChange}
                                            variant="outlined"
                                            error={!!errors.salary}
                                            helperText={errors.salary || 'Месячная зарплата в тенге'}
                                            margin="normal"
                                            inputProps={{
                                                min: 0,
                                                step: 1000
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Поля для детей */}
                            {formData.type === 'child' && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Имя родителя *"
                                            name="parentName"
                                            value={formData.parentName || ''}
                                            onChange={handleChange}
                                            variant="outlined"
                                            error={!!errors.parentName}
                                            helperText={errors.parentName || 'Полное имя родителя или опекуна'}
                                            margin="normal"
                                            required
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="WhatsApp родителя *"
                                            name="parentPhone"
                                            value={formData.parentPhone || ''}
                                            onChange={handleChange}
                                            variant="outlined"
                                            error={!!errors.parentPhone}
                                            helperText={errors.parentPhone || 'WhatsApp номер для связи с родителем (+7XXXXXXXXXX)'}
                                            margin="normal"
                                            required
                                            inputProps={{
                                                inputMode: 'tel'
                                            }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.groupId}>
                                            <InputLabel id="group-label">Группа *</InputLabel>
                                            <Select
                                                labelId="group-label"
                                                name="groupId"
                                                value={formData.groupId || ''}
                                                onChange={handleChange}
                                                label="Группа *"
                                                displayEmpty
                                                required
                                                disabled={groups.length === 0}
                                            >
                                                <MenuItem value="">
                                                    <em>Не выбрана</em>
                                                </MenuItem>
                                                {groups.length > 0 ? (
                                                    groups.map((group) => (
                                                        <MenuItem key={group._id} value={group._id}>
                                                            {group.name} {group.teacher ? `(Воспитатель: ${group.teacher.fullName || 'Не назначен'})` : ''}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem disabled>Нет доступных групп</MenuItem>
                                                )}
                                            </Select>
                                            {errors.groupId ? (
                                                <FormHelperText error>{errors.groupId}</FormHelperText>
                                            ) : (
                                                <FormHelperText>
                                                    {groups.length === 0 ? (
                                                        <span>
                                                            Нет доступных групп. Пожалуйста, создайте группу в разделе 
                                                            <Link to="/app/groups" style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                                                                Группы
                                                            </Link>
                                                        </span>
                                                    ) : (
                                                        'Выберите группу для ребенка'
                                                    )}
                                                </FormHelperText>
                                            )}
                                        </FormControl>
                                    </Grid>
                                </>
                            )}
                           

                            {/* Дата рождения и телефон */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Дата рождения"
                                    name="birthday"
                                    type="date"
                                    value={formData.birthday || ''}
                                    onChange={handleChange}
                                    variant="outlined"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    margin="normal"
                                />
                            </Grid>

                            {/* Телефон и WhatsApp */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Телефон *"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    variant="outlined"
                                    error={!!errors.phone}
                                    helperText={errors.phone || 'Формат: +7XXXXXXXXXX'}
                                    margin="normal"
                                    required
                                    inputProps={{
                                        inputMode: 'tel'
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="WhatsApp"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    variant="outlined"
                                    helperText="Если не указан, будет использован номер телефона"
                                    margin="normal"
                                />
                            </Grid>

                            {/* Роль и группа */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.role}>
                                    <InputLabel id="role-label">Роль *</InputLabel>
                                    <Select
                                        labelId="role-label"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        label="Роль *"
                                        required
                                    >
                                        {roles.length > 0 ? (
                                            roles.map((role) => (
                                                <MenuItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>Загрузка ролей...</MenuItem>
                                        )}
                                    </Select>
                                    {errors.role && (
                                        <FormHelperText error>{errors.role}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.groupId}>
                                    <InputLabel id="group-label">Группа</InputLabel>
                                    <Select
                                        labelId="group-label"
                                        name="groupId"
                                        value={formData.groupId || ''}
                                        onChange={handleChange}
                                        label="Группа"
                                        displayEmpty
                                        disabled={groups.length === 0}
                                    >
                                        <MenuItem value="">
                                            <em>Не выбрана</em>
                                        </MenuItem>
                                        {groups.length > 0 ? (
                                            groups.map((group) => (
                                                <MenuItem key={group._id} value={group._id}>
                                                    {group.name} {group.teacher ? `(Воспитатель: ${group.teacher.fullName || 'Не назначен'})` : ''}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>Нет доступных групп</MenuItem>
                                        )}
                                    </Select>
                                    {errors.groupId ? (
                                        <FormHelperText error>{errors.groupId}</FormHelperText>
                                    ) : (
                                        <FormHelperText>
                                            {groups.length === 0 ? (
                                                <span>
                                                    Нет доступных групп. Пожалуйста, создайте группу в разделе 
                                                    <Link to="/app/groups" style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                                                        Группы
                                                    </Link>
                                                </span>
                                            ) : (
                                                'Выберите группу для сотрудника (необязательно)'
                                            )}
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Примечания */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Примечания"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    variant="outlined"
                                    multiline
                                    rows={4}
                                    margin="normal"
                                />
                            </Grid>

                            {/* Активность */}
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.active}
                                            onChange={(e) => 
                                                setFormData(prev => ({
                                                    ...prev,
                                                    active: e.target.checked
                                                }))
                                            }
                                            name="active"
                                            color="primary"
                                        />
                                    }
                                    label="Активный аккаунт"
                                />
                            </Grid>

                            {/* Кнопки */}
                            <Grid item xs={12} className={classes.buttonsContainer}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => history.push('/app/users')}
                                    disabled={loading}
                                    style={{ marginLeft: '16px' }}
                                >
                                    Отмена
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                    <Stepper activeStep={activeStep}>
                        {steps.map((label, index) => {
                            const stepProps = {}
                            const labelProps = {}
                            if (isStepSkipped(index)) {
                                stepProps.completed = false
                            }
                            return (
                                <Step key={label} {...stepProps}>
                                    <StepLabel {...labelProps} classes={{completed: classes.stepCompleted}}>
                                        {label}
                                    </StepLabel>
                                </Step>
                            )
                        })}
                    </Stepper>
                </Widget>
            </Grid>
            <Grid item xs={12}>
                <Widget>
                    <Grid item justify={'center'} container>
                        <Box
                            display={'flex'}
                            flexDirection={'column'}
                            width={600}
                        >
                            <Typography
                                variant={'h5'}
                                weight={'medium'}
                                style={{ marginBottom: 30 }}
                            >
                                {getStepContent(activeStep)}
                            </Typography>
                            {activeStep === 0 ? (
                                <>
                                    <TextField
                                        id="outlined-basic"
                                        label="Username"
                                        onChange={handleChange}
                                        name="fullName"
                                        value={newUser.fullName || ''}
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText="Please enter your username"
                                    />
                                 
                                    <TextField
                                        id="outlined-basic"
                                        label="Password"
                                        onChange={handleChange}
                                        name="password"
                                        value={newUser.password || ''}
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText={
                                            'Enter your password. Min 6 characters long'
                                        }
                                        type={'password'}
                                    />
                                    <FormControl
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                    >
                                        <InputLabel id="demo-simple-select-outlined-label">
                                            Role
                                        </InputLabel>
                                        <Select
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            value={newUser.role || "user"}
                                            defaultValue="User"
                                            name="role"
                                            onChange={handleChange}
                                            label="Role"
                                        >
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </Select>
                                        <FormHelperText
                                            id={'demo-simple-select-outlined'}
                                        >
                                            Please choose the role
                                        </FormHelperText>
                                    </FormControl>
                                </>
                            ) : activeStep === 1 ? (
                                <>
                                    <Typography weight={'medium'}>
                                        Photo:
                                    </Typography>
                                    <div class={classes.galleryWrap}>
                                    {newUser && newUser.avatars && newUser.avatars.length !== 0 ? (
                                      newUser.avatars.map((avatar, idx) => (
                                        <div className={classes.imgWrap}>
                                          <span className={classes.deleteImageX} onClick={() => deleteOneImage(avatar.id)}>×</span>
                                          <img
                                              src={avatar.publicUrl}
                                              alt="avatar"
                                              height={'100%'}
                                          />                                          
                                        </div>
                                      ))
                                    ): null}
                                    </div>
                                    <label
                                      className={classes.uploadLabel}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {'Upload an image'}
                                        <input style={{ display: 'none' }} accept="image/*" type="file" ref={fileInput} onChange={handleFile} />
                                    </label>
                                    <Typography
                                        size={'sm'}
                                        style={{ marginBottom: 35 }}
                                    >
                                        .PNG, .JPG, .JPEG
                                    </Typography>
                                    <TextField
                                        id="outlined-basic"
                                        label="First Name"
                                        onChange={handleChange}
                                        name="firstName"
                                        value={newUser.firstName || ''}
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText="Enter your first name"
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Last Name"
                                        onChange={handleChange}
                                        name="lastName"
                                        value={newUser.lastName || ''}
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your last name'}
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Contact number"
                                        onChange={handleChange}
                                        value={newUser.phoneNumber || ''}
                                        name="phoneNumber"
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText={
                                            'Enter your contact number '
                                        }
                                    />
                    
                                    <FormControl
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                    >
                                        <InputLabel id="demo-simple-select-outlined-label">
                                            Country
                                        </InputLabel>
                                        <Select
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            value={newUser.role || "user"}
                                            defaultValue="User"
                                            name="role"
                                            onChange={handleChange}
                                            label="Role"
                                        >
                                            <MenuItem value="user">
                                                User
                                            </MenuItem>
                                            <MenuItem value="admin">
                                                Admin
                                            </MenuItem>
                                        </Select>
                                        <FormHelperText
                                            id={'demo-simple-select-outlined'}
                                        >
                                            Choose your role
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                    >
                                        <InputLabel id="demo-simple-select-outlined-label">
                                            State
                                        </InputLabel>
                                        <Select
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            value={''}
                                            label="State"
                                        >
                                            <MenuItem value={10}>User</MenuItem>
                                            <MenuItem value={20}>
                                                Admin
                                            </MenuItem>
                                            <MenuItem value={30}>
                                                Super Admin
                                            </MenuItem>
                                        </Select>
                                        <FormHelperText
                                            id={'demo-simple-select-outlined'}
                                        >
                                            Choose your state
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                    >
                                        <InputLabel id="demo-simple-select-outlined-label">
                                            City
                                        </InputLabel>
                                        <Select
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            value={''}
                                            label="City"
                                        >
                                            <MenuItem value={10}>User</MenuItem>
                                            <MenuItem value={20}>
                                                Admin
                                            </MenuItem>
                                            <MenuItem value={30}>
                                                Super Admin
                                            </MenuItem>
                                        </Select>
                                        <FormHelperText
                                            id={'demo-simple-select-outlined'}
                                        >
                                            Choose your city
                                        </FormHelperText>
                                    </FormControl>
                                    <TextField
                                        id="outlined-basic"
                                        label="Address"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your adress'}
                                    />
                                </>
                            ) : activeStep === 2 ? (
                                <>
                                    <TextField
                                        id="outlined-basic"
                                        label="Company Name"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText="Enter your company name"
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Company Registered ID"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={
                                            'Enter your company registered ID'
                                        }
                                    />
                          
                                    <TextField
                                        id="outlined-basic"
                                        value={''}
                                        label="Company Contact"
                                        onChange={handleChange}
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText={
                                            'Enter your company cpntact'
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <TextField
                                        id="outlined-basic"
                                        label="Facebook"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText="Enter your Facebook link"
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Twitter"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your Twitter link'}
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Instagram"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your Instagram link'}
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="GitHub"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your GitHub link'}
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="CodePen"
                                        variant="outlined"
                                        onChange={handleChange}
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your CodePen link'}
                                    />
                                    <TextField
                                        id="outlined-basic"
                                        label="Slack"
                                        variant="outlined"
                                        style={{ marginBottom: 35 }}
                                        helperText={'Enter your Slack link'}
                                    />
                                </>
                            )}
                            <div>
                                <div>
                                    {activeStep === 0 ? (
                                        <Box
                                            display={'flex'}
                                            justifyContent={'flex-end'}
                                        >
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleNext}
                                            >
                                                Next
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box
                                            display={'flex'}
                                            justifyContent={'space-between'}
                                        >
                                            <Button
                                                onClick={handleBack}
                                                variant={'outlined'}
                                                color={'primary'}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleNext}
                                            >
                                                {activeStep === steps.length - 1
                                                    ? 'Finish'
                                                    : 'Next'}
                                            </Button>
                                        </Box>
                                    )}
                                </div>
                            </div>
                        </Box>
                    </Grid>
                </Widget>
            </Grid>
        </Grid>
    )
}

export default AddUser
