# File Sharing MVP - Setup Guide

This guide will help you set up and run the File Sharing application locally.

## Prerequisites

- Node.js 16+ installed
- PostgreSQL 12+ installed and running
- Git (for version control)
- A code editor (VS Code recommended)

## Project Structure

```
file-sharing-mvp/
├── backend/           # Node.js/Express API
├── frontend/          # React frontend
├── README.md
└── SETUP.md
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE filesharing;

-- Create user (optional)
CREATE USER filesharing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE filesharing TO filesharing_user;
```

#### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# nano .env  # or use your preferred editor
```

Update the `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/filesharing
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Start Backend Server
```bash
npm run dev
```

The backend will be running at `http://localhost:5000`

#### Verify Backend
- Visit `http://localhost:5000/health` - should return status OK
- Check console for any errors

## Frontend Setup

### 1. Navigate to Frontend Directory (in new terminal)
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
The frontend is already configured to connect to `http://localhost:5000`. If you need to change this:
```bash
# Edit .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env
```

### 4. Start Frontend Development Server
```bash
npm start
```

The frontend will be running at `http://localhost:3000`

## Testing the Application

### 1. Basic Upload Test (Anonymous)
1. Open `http://localhost:3000`
2. Drag and drop a file or click to select
3. Wait for upload to complete
4. Copy the shareable link
5. Open the link in a new browser tab/incognito window
6. Download the file to verify it works

### 2. User Registration and Login
1. Click "Sign Up" in the header
2. Create a new account
3. Login with your credentials
4. Access the dashboard

### 3. API Endpoints Testing

#### Health Check
```bash
curl http://localhost:5000/health
```

#### Upload File (using curl)
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -F "file=@/path/to/your/file.txt"
```

#### Get File Info
```bash
curl http://localhost:5000/api/files/{file-id}/info
```

## Common Issues & Solutions

### Backend Issues

#### Database Connection Error
- Check if PostgreSQL is running: `sudo service postgresql status`
- Verify database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

#### Port Already in Use
- Kill process using port 5000: `lsof -ti:5000 | xargs kill -9`
- Or change PORT in `.env` file

#### Missing Dependencies
```bash
cd backend
npm install
```

### Frontend Issues

#### Module Not Found
```bash
cd frontend
npm install
```

#### API Connection Error
- Verify backend is running on port 5000
- Check `REACT_APP_API_URL` in frontend `.env`
- Check browser network tab for failed requests

#### Build Issues
```bash
cd frontend
npm run build
```

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Uses React dev server with hot reload
```

### Running Both Servers
Use two terminal windows/tabs:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm start
```

## File Upload Testing Scenarios

### Test Cases to Verify

1. **Basic Upload**
   - Small files (< 1MB)
   - Medium files (1-10MB) 
   - Large files (50-100MB)

2. **File Types**
   - Images (jpg, png, gif)
   - Documents (pdf, docx, txt)
   - Archives (zip, rar)

3. **Security**
   - Very large files (>100MB) - should be rejected
   - Files with dangerous extensions (.exe, .bat) - should be rejected

4. **Anonymous vs Authenticated**
   - Upload without account
   - Upload with account
   - View dashboard with uploaded files

5. **Link Sharing**
   - Copy shareable link
   - Open in incognito/new browser
   - Download file
   - Verify file integrity

## Production Deployment Notes

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
USE_AWS_S3=true
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket
CORS_ORIGIN=https://your-frontend-domain.com
```

### Security Checklist
- [ ] Change default JWT secret
- [ ] Set up SSL/HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Configure file size limits
- [ ] Set up database backups
- [ ] Configure S3 for file storage

## Support

If you encounter issues:

1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set
3. Ensure PostgreSQL is running
4. Check that all dependencies are installed
5. Try clearing browser cache/storage

## Next Steps for Enhancement

- Add file password protection
- Implement file expiry
- Add file preview functionality
- User dashboard with file management
- File analytics and download tracking
- Email notifications
- Premium account features