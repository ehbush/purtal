# Purtal

![Purtal Icon](https://ehbush.s3.us-west-2.amazonaws.com/images/Purtal.png)

A modern, customizable homepage for your services and bookmarks with service management, health checking, and an admin panel.

## Features

- 🎨 Modern, visually appealing UI with dark theme
- ⚙️ Built-in admin panel for managing services/bookmarks and clients
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

   **Note:** An encryption key for SSH credentials will be automatically generated on first run and saved to `DATA_DIR/.encryption_key`. You can optionally set `ENCRYPTION_KEY` in your environment to use a custom key.

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

## Security

**IMPORTANT**: SSH credentials (passwords, private keys, and passphrases) are encrypted at rest using AES-256-GCM encryption.

### Encryption Key Management

The application automatically generates a secure encryption key on first run and saves it to `DATA_DIR/.encryption_key`. This key is used to encrypt all SSH credentials stored in the system.

**Automatic Key Generation (Default):**
- On first startup, a 256-bit encryption key is automatically generated
- The key is saved to `DATA_DIR/.encryption_key` with restricted permissions (600)
- No user intervention is required
- The key file is automatically loaded on subsequent startups

**Manual Key Configuration (Optional):**
If you prefer to set your own encryption key, you can set the `ENCRYPTION_KEY` environment variable:

**Option 1: Generate a random hex key (recommended)**
```bash
openssl rand -hex 32
```

**Option 2: Use a strong password**
The system will derive a key from your password using PBKDF2, but a random hex key is more secure.

Add the key to your `.env` file:
```bash
ENCRYPTION_KEY=your-generated-key-here
```

Or in `docker-compose.yml`:
```yaml
environment:
  - ENCRYPTION_KEY=your-generated-key-here
```

**⚠️ WARNING**: 
- **Backup the encryption key file** (`DATA_DIR/.encryption_key`) - if lost, all encrypted SSH credentials will be unrecoverable
- The key file should be included in your backup strategy
- Never commit the encryption key to version control
- If using Docker volumes, ensure the data directory (containing the key file) is properly backed up
- Use different keys for different environments (development, staging, production) by setting `ENCRYPTION_KEY` explicitly

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
DYNAMODB_CLIENTS_TABLE=purtal-clients
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
  --table-name purtal-clients \
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

### Adding Clients

Clients are physical devices that support Wake on LAN, SSH access, and/or health checking:

1. Navigate to the Admin Panel
2. In the "Clients" section, click "Add Client"
3. Fill in the client details:
   - **Name**: Display name for the machine
   - **IP Address**: Network IP address
  - **Type**: Select "Health Check (Ping)" to enable ping-based health monitoring
  - **MAC Address**: Required for Wake on LAN functionality
  - **WOL Configuration**: Broadcast address and port (defaults provided)
  - **SSH Configuration** (optional):
    - Enable SSH access
    - Configure host, port, username
    - Use password or private key authentication

**Health Check Type:**
- When type is set to "health-check", the client will be monitored via ICMP ping
- Status will show as "online" if ping succeeds, "offline" if it fails
- Health checks run automatically every 60 seconds

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

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get a specific client
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client

### Wake on LAN
- `POST /api/wol/:id` - Send Wake on LAN packet to a client

### SSH
- `WS /api/ssh/:id/connect` - WebSocket endpoint for SSH terminal connections

### Configuration
- `GET /api/config/settings` - Get portal settings
- `PUT /api/config/settings` - Update portal settings

### Health Checks
- `GET /api/health` - Get health status for all services
- `GET /api/health/:id` - Get health status for a specific service
- `GET /api/health/clients` - Get health status for all clients with health-check type
- `GET /api/health/client/:id` - Get health status for a specific client

## License

MIT
