# Purtal

A modern, customizable homepage for your services and bookmarks with service management, health checking, and an admin panel.

## Features

- 🎨 Modern, visually appealing UI with dark theme
- ⚙️ Built-in admin panel for managing services/bookmarks and machines
- 🔍 Health checking with service status monitoring
- 🎯 Custom icons support (URL or file upload)
- 💻 **Wake on LAN (WOL)**: Send magic packets to wake up remote devices
- 🖥️ **In-browser SSH**: Terminal access directly from the web interface
- 📦 Multiple storage backends:
  - **File-based** (default): Simple JSON file storage
  - **DynamoDB**: For scalable deployments
- 🐳 Docker support for easy deployment
- 🎛️ Simple and advanced configuration modes
- 📱 Responsive design

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd purtal
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the portal at `http://localhost:3001`

### Manual Installation

1. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Start development servers:
```bash
npm run dev
```

3. Access the portal at `http://localhost:3000`

## Configuration

### SSL/TLS Configuration

Purtal supports SSL/TLS encryption with both custom certificates and Let's Encrypt.

#### Custom Certificates

To use your own SSL certificates:

```bash
SSL_MODE=custom
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
SSL_CA_PATH=/path/to/ca-bundle.crt  # Optional
HTTPS_PORT=443
HTTP_PORT=80  # Optional: for HTTP to HTTPS redirect
```

#### Let's Encrypt

For automatic certificate management with Let's Encrypt:

```bash
SSL_MODE=letsencrypt
LETSENCRYPT_DOMAIN=example.com
LETSENCRYPT_EMAIL=admin@example.com
LETSENCRYPT_CERT_DIR=./certs
LETSENCRYPT_ALT_NAMES=www.example.com,api.example.com  # Optional
LETSENCRYPT_PRODUCTION=true  # Set to false for staging
HTTPS_PORT=443
HTTP_PORT=80
SSL_REDIRECT_HTTP=true  # Redirect HTTP to HTTPS
```

**Important for Let's Encrypt:**
- Your domain must point to the server's IP address
- Port 80 must be accessible for HTTP-01 challenge validation
- The application will automatically renew certificates before expiration (checks on startup)
- For testing, set `LETSENCRYPT_PRODUCTION=false` to use Let's Encrypt staging
- Certificates are stored in the directory specified by `LETSENCRYPT_CERT_DIR`
- Make sure the cert directory is persisted (e.g., in Docker volumes) to avoid re-issuing certificates

### Storage Backend

#### File-based Storage (Default)

The default storage uses a JSON file located at `./data/config.json`. This is perfect for simple deployments.

Set environment variable:
```bash
STORAGE_TYPE=file
DATA_DIR=./data
```

#### DynamoDB Storage

For production or scalable deployments, use DynamoDB:

1. Set environment variables:
```bash
STORAGE_TYPE=dynamodb
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
DYNAMODB_SERVICES_TABLE=purtal-services
DYNAMODB_SETTINGS_TABLE=purtal-settings
DYNAMODB_MACHINES_TABLE=purtal-machines
```

2. Create DynamoDB tables:
```bash
aws dynamodb create-table \
  --table-name purtal-services \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table \
  --table-name purtal-settings \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table \
  --table-name purtal-machines \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Environment Variables

Copy `backend/env.example` to `backend/.env` and configure:

```env
PORT=3001
STORAGE_TYPE=file
DATA_DIR=./data
```

## Usage

### Adding Services

1. Navigate to the Admin Panel (click "Admin" in the navigation)
2. Click "Add Service"
3. Fill in the service details:
   - **Name**: Display name for the service
   - **URL**: Link to the service
   - **Description**: Optional description
   - **Category**: Optional category for grouping
   - **Icon**: URL to an icon image, or upload a custom icon

### Adding Machines

Machines are physical devices that support Wake on LAN and/or SSH access:

1. Navigate to the Admin Panel
2. In the "Machines" section, click "Add Machine"
3. Fill in the machine details:
   - **Name**: Display name for the machine
   - **IP Address**: Network IP address
   - **MAC Address**: Required for Wake on LAN functionality
   - **WOL Configuration**: Broadcast address and port (defaults provided)
   - **SSH Configuration** (optional):
     - Enable SSH access
     - Configure host, port, username
     - Use password or private key authentication

### Advanced Configuration

Enable "Advanced Configuration" to set up health checking:

- **Health Check URL**: Endpoint to check service health
- **HTTP Method**: GET, POST, or HEAD
- **Timeout**: Request timeout in milliseconds
- **Expected Status Code**: HTTP status code indicating healthy service

### Portal Settings

In the Admin Panel, you can configure:
- **Portal Title**: Customize the portal name
- **Layout**: Choose between Grid or List layout

## Development

### Project Structure

```
purtal/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server
│   │   ├── storage/           # Storage adapters
│   │   │   ├── adapter.js
│   │   │   ├── fileStorage.js
│   │   │   └── dynamoStorage.js
│   │   └── routes/            # API routes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   └── utils/            # Utilities
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Building for Production

```bash
npm run build
```

The frontend will be built to `frontend/dist` and the backend will serve it.

## API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get a specific service
- `POST /api/services` - Create a new service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service

### Machines
- `GET /api/machines` - Get all machines
- `GET /api/machines/:id` - Get a specific machine
- `POST /api/machines` - Create a new machine
- `PUT /api/machines/:id` - Update a machine
- `DELETE /api/machines/:id` - Delete a machine

### Wake on LAN
- `POST /api/wol/:id` - Send Wake on LAN packet to a machine

### SSH
- `WS /api/ssh/:id/connect` - WebSocket endpoint for SSH terminal connections

### Configuration
- `GET /api/config/settings` - Get portal settings
- `PUT /api/config/settings` - Update portal settings

### Health Checks
- `GET /api/health` - Get health status for all services
- `GET /api/health/:id` - Get health status for a specific service

## License

MIT
