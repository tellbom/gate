# Oversia

Oversia is an enterprise-level management system built on Vue 3 + TypeScript + Element Plus, providing comprehensive features such as user permission management, data security, and operation logs.

## Technology Stack

- **Frontend Framework**: Vue 3
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **UI Component Library**: Element Plus
- **HTTP Requests**: Axios
- **Build Tool**: Vite
- **Code Quality**: ESLint + Prettier

## Project Structure

```
src/
├── api/                    # API layer
│   ├── backend/            # Backend management API
│   └── frontend/           # Frontend user API
├── assets/                 # Static resources
├── components/             # Common components
│   ├── baInput/            # Form input components
│   ├── claudetable/        # Table component
│   ├── table/              # Table rendering
│   └── todo/               # Workflow components
├── layouts/                # Layout components
│   ├── backend/            # Backend layout
│   ├── common/             # Common layout
│   └── frontend/           # Frontend layout
├── lang/                   # Internationalization language packs
│   ├── backend/            # Backend language
│   ├── common/             # Common language
│   └── frontend/           # Frontend language
├── router/                 # Routing configuration
├── stores/                 # Pinia state management
├── styles/                 # Global styles
├── utils/                  # Utility functions
└── views/                  # Page views
    ├── backend/            # Backend management pages
    ├── common/             # Common pages
    └── frontend/           # Frontend user pages
```

## Features

### Backend Management
- User Management - Admin account management
- User Group Management - Permission group configuration
- Rule Management - Permission rule setup
- Module Management - System module installation and configuration
- System Configuration - System parameter settings
- Attachment Management - File upload and management
- Security Center - Data recycle bin, sensitive data management
- Operation Logs - Administrator operation records
- Workflow - Approval process management

### Frontend User Center
- User Login/Registration
- Account Balance
- Points Management
- Profile Management
- Password Change

### System Features
- Responsive layout supporting multiple screen sizes
- Dark/Light theme switching
- Internationalization support (Chinese/English)
- RBAC permission control
- Data recycling mechanism
- Sensitive data protection
- Operation log auditing

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build production version
npm run build

# Code linting
npm run lint
```

## Configuration

The project supports multi-environment configuration:
- `.env` - Default configuration
- `.env.development` - Development environment configuration
- `.env.production` - Production environment configuration

## License

MIT License