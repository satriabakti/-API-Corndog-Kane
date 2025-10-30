# Corndog Kane API

A production-ready RESTful API built with TypeScript, Express, Prisma, and following Hexagonal Architecture principles.

## 🚀 Features

- ✅ **Hexagonal Architecture** (Ports & Adapters)
- ✅ **Design Patterns**: Factory, DI, Chain of Responsibility, Strategy, Observer, Specification, Builder
- ✅ **TypeScript** with strict type checking
- ✅ **Prisma ORM** for database management
- ✅ **Express.js** web framework
- ✅ **Zod** validation
- ✅ **Redis** caching support
- ✅ **JWT Authentication**
- ✅ **File Upload** (Multer)
- ✅ **CI/CD** with GitHub Actions
- ✅ **Systemd** service for production

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis (optional)
- npm or yarn

## 🛠️ Installation

### Local Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Corndog-Kane-API.git
cd Corndog-Kane-API

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Build TypeScript
npm run build

# Start development server
npm run start:dev
```

### Production Deployment

See **[README_CICD.md](./README_CICD.md)** for complete CI/CD setup guide.

Quick deployment:

```bash
# On your VPS
cd /home/kane
git clone YOUR_REPO_URL Corndog-Kane-API
cd Corndog-Kane-API
chmod +x scripts/*.sh
sudo ./scripts/setup-server.sh
```

## 📁 Project Structure

```
├── src/
│   ├── adapters/          # External adapters (DB, APIs, etc.)
│   │   ├── midtrans/
│   │   ├── postgres/
│   │   └── redis/
│   ├── configs/           # Configuration files
│   ├── core/              # Business logic (domain layer)
│   │   ├── builders/      # Builder pattern implementations
│   │   ├── entities/      # Domain entities & types
│   │   ├── repositories/  # Repository interfaces
│   │   ├── services/      # Business services
│   │   ├── specifications/# Specification pattern
│   │   └── strategies/    # Strategy pattern
│   ├── mappers/           # Entity/Response mappers
│   ├── policies/          # Authorization & policies
│   └── transports/        # External interfaces
│       └── api/           # REST API
│           ├── controllers/
│           ├── routers/
│           └── validations/
├── scripts/               # Deployment & utility scripts
│   ├── setup-server.sh    # Initial server setup
│   ├── deploy.sh          # Deployment script
│   ├── health-check.sh    # Health check
│   └── generate.js        # Code generator CLI
├── prisma/                # Database schema & migrations
├── tests/                 # Test files
└── .github/workflows/     # CI/CD workflows
```

## 🎯 Available Scripts

### Development
```bash
npm run start:dev          # Start development server with nodemon
npm run build              # Build TypeScript to JavaScript
npm run start              # Start production server
npm run start:prod         # Start production server (alias)
```

### Database
```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations (dev)
npm run prisma:push        # Push schema to database
npm run prisma:studio      # Open Prisma Studio
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm test                   # Run tests with coverage
```

### Code Generation
```bash
npm run create:resource -- --name product         # Create new resource
npm run create:resource -- --schema Product       # Create from Prisma schema
npm run create:endpoint -- --name list --resource product
npm run create:model -- --name product
```

## 🔧 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 Deployment

### Automatic Deployment (CI/CD)

1. **Setup GitHub Secrets:**
   - `VPS_HOST`: Your VPS IP
   - `VPS_PORT`: SSH port (22)
   - `VPS_USERNAME`: kane
   - `VPS_PASSWORD`: Your password

2. **Push to master:**
   ```bash
   git push origin master
   ```

3. **GitHub Actions automatically:**
   - Connects to VPS
   - Pulls latest code
   - Installs dependencies
   - Builds application
   - Runs migrations
   - Restarts service

### Manual Deployment

```bash
ssh kane@YOUR_VPS_IP
cd /home/kane/Corndog-Kane-API
./scripts/deploy.sh
```

## 🔍 API Endpoints

### Health Check
```bash
GET /api/v1/health
```

### Authentication
```bash
POST /api/v1/auth/login
POST /api/v1/auth/register
```

### Inventory (Unified Material & Product)
```bash
# Stock In (Batch)
POST   /api/v1/inventory/in

# Buy List (Material + Product PURCHASE)
GET    /api/v1/inventory/buy
```

### Resources
```bash
# Users
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id

# Roles
GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/:id
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id

# Products
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id

# ... and more
```

## 🛠️ Service Management

```bash
# Check status
sudo systemctl status corndog-kane-api

# View logs (real-time)
sudo journalctl -u corndog-kane-api -f

# Restart service
sudo systemctl restart corndog-kane-api

# Stop service
sudo systemctl stop corndog-kane-api
```

## 📚 Documentation

- [CI/CD Setup Guide](./README_CICD.md) - Complete deployment guide
- [Quick Deploy Commands](./QUICK_DEPLOY.md) - Quick reference
- [Detailed Deployment](./DEPLOYMENT.md) - Comprehensive deployment docs
- [Generator Updates](./GENERATOR_UPDATES.md) - Code generator documentation
- [Before/After Comparison](./BEFORE_AFTER_COMPARISON.md) - Pattern examples
- [Inventory Stock In API](./docs/inventory-in-api-reference.md) - Unified stock in endpoint
- [Inventory Buy List API](./docs/inventory-buy-api-reference.md) - Unified purchase list endpoint

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters):

- **Core/Domain Layer**: Pure business logic, no external dependencies
- **Adapters Layer**: Implementations of external interfaces (DB, APIs)
- **Transport Layer**: Entry points (REST API, Jobs, Kafka)

### Design Patterns Implemented

1. **Factory Pattern** - Centralized object creation
2. **Dependency Injection** - Loose coupling
3. **Chain of Responsibility** - Error handling pipeline
4. **Strategy Pattern** - Validation strategies
5. **Observer Pattern** - Event system
6. **Specification Pattern** - Complex query logic
7. **Builder Pattern** - Complex object construction

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔒 Security

- Environment-based configuration
- JWT authentication
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (Helmet)
- CORS configuration
- Rate limiting
- File upload size limits

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**lutfian.rhdn**

## 🙏 Acknowledgments

- Express.js team
- Prisma team
- TypeScript community
- All contributors

---

For deployment questions, see [README_CICD.md](./README_CICD.md)
