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

- Node.js 20 or later
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
curl -H "X-API-Key: replace_with_a_long_random_value" http://localhost:5001/api/health
```

### API Access

All public client endpoints require the `X-API-Key` request header. Set `PUBLIC_API_KEY` to a long random value in the active environment file and send that same value with requests. The Stripe webhook is the exception; it authenticates requests with Stripe's `stripe-signature` header.

Example payment-config request:

```bash
curl -H "X-API-Key: $PUBLIC_API_KEY" \
	http://localhost:5001/api/online-payment/config
```

## Environment Configuration

Environment files are intentionally ignored by Git. Create `env/development.env` locally using this safe template. Replace every placeholder with credentials for your own environment; do not commit real credentials.

```env
# env/development.env
PORT=5001
TOKEN_SECRET=replace-with-a-long-random-secret
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
JWT_ISSUER=juice-bar-api
JWT_AUDIENCE=juice-bar-client
DB=mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority

BASE_URL=http://localhost:5001
WEB_BASE_URL=http://localhost:3000
SET_TOKEN=60s
RESET_TOKEN=6h
RESET_TOKEN_SCE=21600
TZ=Asia/Colombo
MAX_IMAGE_SET_COUNT=5
STATIC_DIR=../client

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me

STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
PUBLIC_API_KEY=replace_with_a_long_random_value
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET_KEY=whsec_replace_me
STRIPE_LIVE_MODE=false
PAYMENT_PENDING_TIMEOUT_MINUTES=60

# Either terminate TLS at a reverse proxy, or provide certificate files directly:
FORCE_HTTPS=true
HTTPS_KEY_PATH=/absolute/path/to/tls/key.pem
HTTPS_CERT_PATH=/absolute/path/to/tls/cert.pem

SENTRY_DSN=https://public-key@organization.ingest.sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1

SENDGRID_API_KEY=SG.replace_me
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-email-app-password
SMTP_FROM=your-email@example.com
SMTP_TO=your-email@example.com
```

`NODE_ENV` selects the file at `env/<NODE_ENV>.env`. Because the application chooses that file before loading it, set `NODE_ENV` in the shell or process environment when using anything other than the default `development` environment.

## Security Operations

Rotate any credentials that were previously exposed in source control or environment files: Stripe, MongoDB, Cloudinary, SMTP, Sentry, and JWT secrets. Update the active deployment environment after rotating each credential; existing access and refresh tokens must be reissued after JWT secret rotation.

Legacy payment fields can be removed from the configured database with the guarded maintenance command below. Back up the database and verify the selected environment before running it. The command is intentionally not run during application startup.

```bash
CONFIRM_PAYMENT_DATA_REDACTION=true npm run security:redact-payment-data
```

For production HTTPS, terminate TLS at a trusted reverse proxy and set `FORCE_HTTPS=true`, or provide both `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH` for native TLS. Never commit certificate or private-key files.

## Project Structure

```text
.
├── docs/                         # API and payment flow documentation
│   ├── API.md                   # Endpoint reference and auth requirements
│   └── PAYMENT_FLOW.md          # Stripe payment flow documentation
├── env/                         # Local environment files (ignored by Git)
├── postman/                     # Postman collection assets
│   └── juice-bar-api.postman_collection.json
├── scripts/
│   └── redactSensitivePaymentData.js
├── src/
│   ├── controllers/             # Route handlers by feature
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── city.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── mail.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── index.js                 # Express app entry point
│   ├── logs/                    # Runtime request and error logs (ignored by Git)
│   ├── middleware/
│   │   ├── apiKey.js            # Public endpoint API key verifier
│   │   ├── authorization.js     # JWT and role authorization
│   │   ├── errorHandler.js      # Central error middleware
│   │   ├── logEvents.js         # Request and error logging
│   │   └── rateLimit.js         # Rate limiting configuration
│   ├── models/
│   │   ├── category.model.js
│   │   ├── city.modal.js
│   │   ├── oder.model.js
│   │   ├── product.model.js
│   │   ├── refreshToken.modal.js
│   │   ├── user.model.js
│   │   ├── variant.modal.js
│   │   └── sub/
│   ├── router/
│   │   └── api.router.js        # API mount points for each feature
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── category.service.js
│   │   ├── city.service.js
│   │   ├── dashboard.service.js
│   │   ├── order.service.js
│   │   ├── order.v2.service.js
│   │   ├── payment.service.js
│   │   ├── product.service.js
│   │   └── user.service.js
│   ├── shared/
│   │   ├── authTokens.js
│   │   ├── cloudinary.config.js
│   │   ├── constants.js
│   │   ├── database.js
│   │   ├── email.services.js
│   │   ├── generatePassword.js
│   │   ├── hhttp.error.js
│   │   ├── multer.config.js
│   │   ├── orderAccess.js
│   │   ├── paymentVerification.js
│   │   └── validation.js
│   └── logs/                   # Runtime logs folder
├── .gitignore
├── .prettierrc.json
├── package.json
├── README.md
├── test/
│   └── security.test.js
└── package-lock.json
```

## API Documentation

The complete endpoint reference, including authentication, validation, parameters, payloads, and response formats, is available in [docs/API.md](docs/API.md).

Import [postman/juice-bar-api.postman_collection.json](postman/juice-bar-api.postman_collection.json) into Postman to access every API endpoint grouped by feature. Before sending requests, set the collection variables for `apiKey`, `accessToken`, `refreshToken`, IDs, and `imagePath` as needed.

## Available Scripts

| Command                                | Description                                                                |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                          | Start the API with nodemon.                                                |
| `npm test`                             | Run the focused security test suite.                                       |
| `npm run security:redact-payment-data` | Remove legacy client secrets and Stripe event payloads after confirmation. |
| `npm run format`                       | Format repository files with Prettier.                                     |
| `npm run format:check`                 | Check repository formatting with Prettier.                                 |
