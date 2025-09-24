# Frontend Documentation

## Overview

This is the frontend application for the Kindergarten Management System. It's built with React and Material-UI, providing a comprehensive interface for managing all aspects of a kindergarten.

## Technologies Used

- **React** - JavaScript library for building user interfaces
- **Material-UI** - React components for faster and easier web development
- **TypeScript** - Typed superset of JavaScript
- **Axios** - Promise based HTTP client
- **React Router** - Declarative routing for React
- **XLSX** - Library for reading and writing Excel files
- **FileSaver** - Client-side solution for saving files

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── App.tsx         # Main application component
│   ├── Sidebar/        # Sidebar navigation
│   └── context/        # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── Children/       # Children management pages
│   ├── Staff/          # Staff management pages
│   ├── Documents/      # Document management pages
│   ├── Reports/       # Reporting pages
│   └── Settings/       # Settings pages
├── services/          # API service clients
│   └── api/            # Individual API modules
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    ├── api.ts          # API client utilities
    ├── excelExport.ts  # Excel export utilities
    ├── format.ts       # Data formatting utilities
    └── validation.ts   # Data validation utilities
```

## Key Features

### 1. User Management
- User authentication (login/logout)
- Role-based access control
- User profile management
- Password reset functionality

### 2. Children Management
- Child registration and profile management
- Group assignment
- Parent information management
- Medical information tracking

### 3. Staff Management
- Employee profile management
- Role and permission assignment
- Contact information
- Employment details

### 4. Attendance Tracking
- Daily attendance marking for children
- Staff time tracking
- Absence reporting
- Late arrival tracking

### 5. Scheduling
- Staff shift scheduling
- Group activity scheduling
- Calendar view
- Schedule notifications

### 6. Documents
- Document upload and management
- Document templates
- Document categorization
- Document search and filtering
- Document download and sharing

#### Document Types
- Contracts
- Certificates
- Reports
- Policies
- Other custom documents

#### Document Categories
- Staff-related documents
- Children-related documents
- Financial documents
- Administrative documents
- Other custom categories

### 7. Reporting
- Attendance reports
- Financial reports
- Staff performance reports
- Child progress reports
- Custom report generation
- Report export (PDF, Excel, CSV)

### 8. Payroll
- Salary calculation
- Bonus and deduction tracking
- Payroll reports
- Payment history

### 9. Settings
- System configuration
- User preferences
- Notification settings
- Data backup and restore

## API Integration

The frontend communicates with the backend API through service modules located in `src/services/api/`. Each module handles specific API endpoints:

- `auth.ts` - Authentication endpoints
- `users.ts` - User management endpoints
- `groups.ts` - Group management endpoints
- `attendance.ts` - Attendance tracking endpoints
- `shifts.ts` - Staff shift endpoints
- `documents.ts` - Document management endpoints
- `reports.ts` - Reporting endpoints
- `payroll.ts` - Payroll endpoints
- `settings.ts` - Settings endpoints

## State Management

The application uses React Context API for state management:

- `AuthContext` - Authentication state
- `GroupsContext` - Group data
- `TimeTrackingContext` - Time tracking data

## Routing

The application uses React Router for navigation with the following main routes:

- `/login` - Login page
- `/app` - Main application layout
- `/app/dashboard` - Dashboard
- `/app/children` - Children management
- `/app/staff` - Staff management
- `/app/documents` - Document management
- `/app/reports` - Reporting
- `/app/settings` - Settings

## Styling

The application uses Material-UI for styling with a consistent theme. Custom styles are implemented using:

- Material-UI's `sx` prop
- Styled components
- CSS modules where needed

## Data Export

The application supports exporting data in multiple formats:

- **Excel** - Detailed reports with formatting
- **PDF** - Printable reports
- **CSV** - Simple data exports

Export functionality is implemented in `src/utils/excelExport.ts`.

## Validation

Form validation is implemented using custom validation utilities in `src/utils/validation.ts`. The validation includes:

- Required field validation
- Email format validation
- Phone number validation
- Date validation
- Numeric value validation
- Custom business rule validation

## Error Handling

The application implements comprehensive error handling:

- API error handling
- Form validation errors
- User-friendly error messages
- Error logging

## Testing

The application includes unit tests and integration tests for critical components and services.

## Deployment

To build and deploy the application:

1. Install dependencies: `npm install`
2. Build the application: `npm run build`
3. Serve the built files from the `build/` directory

## Environment Variables

The application uses environment variables for configuration:

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_NAME` - Application name

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
