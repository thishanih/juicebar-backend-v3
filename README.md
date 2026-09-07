# Juice Bar E-commerce API

An Express and MongoDB backend for a juice bar e-commerce application. It provides staff administration, catalog and inventory management, delivery cities, customer orders, Stripe payments, email integration, and admin dashboard reporting.

## Stack

- Node.js with ES modules
- Express
- MongoDB with Mongoose
- JWT authentication and role-based authorization
- Joi request validation
- Cloudinary image storage
- Stripe payments

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A MongoDB database
- Cloudinary credentials configured by the application
- Stripe keys for online payment support

### Install and Run

```bash
npm install
npm run dev
```

The server loads `env/development.env` by default and listens on the `PORT` value in that file. To run another environment, set `NODE_ENV` before starting the server:

```bash
NODE_ENV=test npm run dev
```

Verify that the API is running:

```bash
curl http://localhost:5001/api/health
```

## Environment Configuration

Environment files are intentionally ignored by Git. Create `env/development.env` locally using this safe template. Replace every placeholder with credentials for your own environment; do not commit real credentials.

```env
# env/development.env
PORT=5001
TOKEN_SECRET=replace-with-a-long-random-secret
DB=mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority

BASE_URL=http://localhost:5001
WEB_BASE_URL=http://localhost:3000
SET_TOKEN=60s
RESET_TOKEN=6h
RESET_TOKEN_SCE=21600
TZ=Asia/Colombo
MAX_IMAGE_SET_COUNT=5
STATIC_DIR=../client

STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET_KEY=whsec_replace_me

SENDGRID_API_KEY=SG.replace_me
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-email-app-password
```

`NODE_ENV` selects the file at `env/<NODE_ENV>.env`. Because the application chooses that file before loading it, set `NODE_ENV` in the shell or process environment when using anything other than the default `development` environment.

## Project Structure

```text
.
├── env/                         # Local environment files (ignored by Git)
├── postman/                     # Postman collection assets
├── src/
│   ├── index.js                 # Express app entry point
│   ├── logs/                    # Runtime request and error logs (ignored by Git)
│   ├── middleware/
│   │   ├── authorization.js     # JWT and role authorization
│   │   ├── errorHandler.js      # Central error middleware
│   │   └── logEvents.js         # Request and error logging
│   ├── models/                  # Mongoose models
│   │   └── sub/                 # Embedded schema definitions
│   ├── routers/                 # Route declarations, mounted under /api
│   ├── services/                # Business logic and database operations
│   └── shared/                  # Database, validation, uploads, email, and utilities
├── .gitignore
├── .prettierrc.json
├── package.json
└── README.md
```

## API Documentation

The complete endpoint reference, including authentication, validation, parameters, payloads, and response formats, is available in [docs/API.md](docs/API.md).

## Available Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the API with nodemon.                |
| `npm run format`       | Format repository files with Prettier.     |
| `npm run format:check` | Check repository formatting with Prettier. |
