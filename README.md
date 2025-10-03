# FILE-SHARE 🚀

A modern, secure file sharing application built with React, Node.js, and Clerk authentication. Upload files and generate shareable links instantly with a beautiful, animated interface.

## ✨ Features

- **🔐 Secure Authentication** - Powered by Clerk with email verification
- **📁 Drag & Drop Upload** - Intuitive file upload with progress tracking
- **🔗 Instant Sharing** - Generate shareable links immediately
- **⏰ Auto Expiry** - Links expire automatically for privacy protection
- **🎨 Modern UI** - Beautiful glassmorphism design with smooth animations
- **📱 Responsive** - Works perfectly on all devices
- **⚡ Real-time Updates** - Live upload progress and status updates

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Clerk React** for authentication
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Clerk SDK** for authentication
- **Multer** for file uploads
- **JWT** for token management

## Quick Start

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- AWS Account (for S3, optional for dev)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and AWS credentials
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Setup

```bash
# Create database
createdb filesharing

# Run migrations
cd backend
npm run migrate
```

## Environment Variables

Create `.env` file in backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/filesharing

# JWT
JWT_SECRET=your-super-secret-jwt-key

# AWS S3 (optional, uses local storage if not set)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# File Upload
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=./uploads
LINK_EXPIRY_DAYS=7
```

## API Endpoints

- `POST /api/upload` - Upload file
- `GET /api/download/:id` - Download file
- `POST /api/auth/register` - Register user (optional)
- `POST /api/auth/login` - Login user (optional)
- `GET /api/files` - List user files (authenticated)

## Project Structure

```
file-sharing-mvp/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
└── README.md
```