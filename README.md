# Tea Plantation Management System

A web-based management system for tea plantation operations, built as part of our ITP coursework. The system helps manage different aspects of tea plantation operations from field supervision to production and inventory management.

🌐 **Live Demo**: [https://ceylonleaf.vercel.app](https://ceylonleaf.vercel.app)

---

## Demo Credentials

Try out different user roles with these test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Inventory Manager** | Inventory@ceylonleaf.com | Inventory123# |
| **Field Supervisor** | supervisor@ceylonleaf.com | Supervisor123# |
| **Production Manager** | production@ceylonleaf.com | Production123# |
| **Worker** | ruwan@gmail.com | Ruwan123# |
| **Admin** | 🔒 *Credentials hidden for security* | 🔒 *Contact repository owner* |


---

## What This System Does

This project manages tea plantation operations through different user roles:

**Admin Dashboard**
- Manage system users and their roles
- Configure plantation fields
- Send notifications to workers

**Field Supervisor Functions**
- Track worker attendance with QR code scanning
- Assign daily tasks to workers
- Record field incidents and pest problems
- Monitor plucking records

**Production Manager Tools**
- Create and track production batches
- Manage transport and vehicle tracking
- Generate production reports
- Monitor quality metrics

**Inventory Manager Features**
- Track tools and equipment
- Manage fertilizer and nutrient supplies
- Monitor stock levels
- Generate inventory reports

**Worker Interface**
- View assigned tasks
- Submit field reports
- Check attendance records

## Key Features

- 🔐 **User Authentication**: Secure login system with different roles
- 📱 **Attendance System**: QR code-based attendance tracking
- 🗺️ **GPS Tracking**: Real-time vehicle location monitoring
- 📲 **Mobile Support**: Works on phones and tablets for field use
- 📊 **Report Generation**: PDF reports for production and inventory
- 🌐 **Network Access**: Can be accessed from multiple devices on same network

## Technologies Used

**Frontend**: React.js, Tailwind CSS, Vite  
**Backend**: Node.js, Express.js  
**Database**: MongoDB  
**Caching & Rate Limiting**: Upstash Redis  
**Maps**: Leaflet for GPS tracking  
**AI/ML**: Google Gemini AI for pest analysis  
**Authentication**: JWT tokens

## Development Setup

### Prerequisites
- Node.js installed
- MongoDB running
- Git

### Installation Steps

1. Clone this project
```bash
git clone https://github.com/DilshaPrathibha/Tea-Plantation-Management-System.git
```

2. **Configure Environment Variables**

Create `.env` file in the BACKEND directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5001
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

Create `.env` file in the FRONTEND directory:
```env
VITE_API_URL=http://localhost:5001
```

> ⚠️ **Security Note**: Never commit `.env` files to version control. Keep your credentials secure.

3. Setup Backend
```bash
cd BACKEND
npm install
npm run dev
```

4. Setup Frontend (new terminal)
```bash
cd FRONTEND
npm install
npm run dev
```

5. Access the application

### Local Access
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

### Network Access
- Run `node network-info.js` to see all available URLs
- Perfect for mobile testing and team collaboration
- Use the network IP address (e.g., http://192.168.1.100:5173)

## Project Structure

```
BACKEND/         - Node.js API server
  src/
    controllers/ - Business logic
    models/      - Database models
    routes/      - API endpoints
    server.js    - Main server file

FRONTEND/        - React application
  src/
    components/  - Reusable UI components
    pages/       - Application pages
    layouts/     - Page layouts for different roles
    App.jsx      - Main app component
```

## Testing the System

1. Start both backend and frontend servers
2. Create admin user through database or registration
3. Login and create other user types
4. Test different role functionalities
5. Try mobile access using network URLs

## API Documentation

The backend provides RESTful APIs for all operations. Base URL: `http://localhost:5001`

### Main API Endpoints

**Authentication**
- `POST /api/auth/login` - User login

**Attendance Management**
- `POST /api/attendance/checkin` - QR-based check-in
- `POST /api/attendance/checkout` - QR-based check-out
- `GET /api/attendance` - List all attendance records
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

**Task Management**
- `GET /api/tasks/today` - Get today's tasks
- `GET /api/tasks/eligible-workers` - Get available workers
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

**Field Management**
- `GET /api/fields` - List all fields
- `POST /api/fields` - Create new field
- `PUT /api/fields/:id` - Update field
- `DELETE /api/fields/:id` - Delete field

**Production Management**
- `GET /api/production-batches` - List production batches
- `POST /api/production-batches` - Create batch
- `POST /api/production-batch-records/generate` - Generate production records
- `GET /api/production-batch-records` - View batch records

**Pest & Disease Management**
- `GET /api/pest-diseases` - List pest diseases
- `POST /api/pest-diseases` - Report new pest/disease
- `GET /api/plucking-records` - View plucking records
- `GET /api/incidences` - List field incidents
- `GET /api/pest-nutrients` - Pest nutrient data

**Inventory & Tools**
- `GET /api/tools` - List all tools
- `POST /api/tools` - Add new tool
- `POST /api/tools/:id/assign` - Assign tool to worker
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Add new supplier
- `GET /api/fni/items` - List fertilizer/nutrient items
- `POST /api/fni/items/:id/adjust` - Adjust stock levels

**Transport Management**
- `GET /api/transports` - List transport records
- `POST /api/transports` - Create transport entry
- `GET /api/vehicle-location/vehicle-location` - Real-time GPS tracking
- `GET /api/transport-reports` - Generate transport reports

**Communication**
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Send notification
- `GET /api/tickets` - List support tickets
- `POST /api/tickets` - Create new ticket

**AI Features**
- `POST /api/ai/pest-analysis` - AI-powered pest identification using Gemini AI

> 🔒 Most endpoints require JWT authentication. Include token in `Authorization: Bearer <token>` header.

## Contributing & Team

This project was developed as part of ITP (Information Technology Project) coursework.

### Team Members
- [@DilshaPrathibha](https://github.com/DilshaPrathibha)
- [@Bupathii](https://github.com/Bupathii)
- [@HarithManjuka](https://github.com/HarithManjuka)
- [@Ashin44-E](https://github.com/Ashin44-E)
- [@Dinaz-12](https://github.com/Dinaz-12)

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is developed for educational purposes as part of SLIIT ITP coursework.

---

This system demonstrates full-stack web development skills including database design, API development, user authentication, and responsive UI design.
