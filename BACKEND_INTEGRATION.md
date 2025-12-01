# Backend Integration Guide

Приложение Домовой построено с модульной бэкенд-архитектурой, которая легко интегрируется с вашей предпочитаемой базой данных и облачным хранилищем.

## Current Implementation

The application currently uses **in-memory storage** for demonstration purposes. This includes:
- User accounts (residents and staff)
- Service requests
- Session management

## Database Integration

### Location
All database operations are centralized in `app/lib/db.server.ts`

### Supported Operations

**Users:**
- `getUserByEmail(email)` - Find user by email
- `getUserById(id)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUser(id, updates)` - Update user data

**Requests:**
- `getRequestById(id)` - Get single request
- `getRequestsByUserId(userId)` - Get user's requests
- `getAllRequests()` - Get all requests (staff only)
- `createRequest(requestData)` - Create new request
- `updateRequest(id, updates)` - Update request
- `deleteRequest(id)` - Delete request
- `getRequestStats()` - Get statistics

### Recommended Databases

**PostgreSQL (Recommended):**
```bash
npm install @prisma/client prisma
```

**MongoDB:**
```bash
npm install mongodb mongoose
```

**MySQL:**
```bash
npm install mysql2
```

### Data Models

**User:**
```typescript
{
  id: string;
  email: string;
  password: string; // bcrypt hashed
  name: string;
  role: "resident" | "staff";
  apartment?: string;
  createdAt: Date;
}
```

**Request:**
```typescript
{
  id: string;
  userId: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "in_progress" | "resolved" | "closed";
  apartment: string;
  description: string;
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  staffNotes?: string;
}
```

## Authentication

### Location
Authentication logic is in `app/lib/auth.server.ts`

### Current Implementation
- Cookie-based sessions
- Simple password hashing (replace with bcryptjs in production)

### Recommended Production Setup

**Using bcryptjs:**
```typescript
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Using JWT:**
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

export function createToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}
```

### Environment Variables
Create a `.env` file:
```env
SESSION_SECRET=your-super-secret-key-change-this
DATABASE_URL=postgresql://user:password@localhost:5432/domovoy
```

## File Upload Integration

### Location
File upload logic is in `app/lib/upload.server.ts`

### Current Implementation
Files are saved to `public/uploads/` directory

### Recommended Cloud Storage

**AWS S3:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function saveUploadedFile(file: File): Promise<string> {
  const key = `uploads/${Date.now()}-${file.name}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));
  
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
```

**Cloudinary:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'domovoy' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}
```

## Demo Credentials

The application includes demo accounts for testing:

**Resident Account:**
- Email: `resident@demo.com`
- Password: `password123`

**Staff Account:**
- Email: `staff@demo.com`
- Password: `password123`

## AI Integration (Optional)

For real AI-powered classification and dialogue, integrate with:

**OpenAI:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function classifyProblem(description: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Classify the following maintenance request into categories: leak, elevator, heating, electrical, plumbing, or other.'
    }, {
      role: 'user',
      content: description
    }],
  });
  
  return response.choices[0].message.content;
}
```

## Production Checklist

- [ ] Replace in-memory database with PostgreSQL/MongoDB/MySQL
- [ ] Implement proper password hashing with bcryptjs
- [ ] Set up secure session management
- [ ] Configure cloud storage for file uploads
- [ ] Add environment variables for secrets
- [ ] Set up email notifications (SendGrid, AWS SES, etc.)
- [ ] Add rate limiting and DDoS protection
- [ ] Implement proper error logging (Sentry, LogRocket)
- [ ] Set up database backups
- [ ] Configure SSL/TLS certificates
- [ ] Add API documentation
- [ ] Set up monitoring and analytics

## Deployment

The application is built with React Router v7 and can be deployed to:
- Vercel
- Netlify
- AWS Amplify
- Railway
- Fly.io
- Self-hosted Node.js server

Follow the standard React Router deployment guides for your chosen platform.
