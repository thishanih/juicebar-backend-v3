# API Reference

This reference documents the Express routes currently mounted by the application. Authentication labels reflect the middleware currently enforced by the API.

## Base URL

```text
http://localhost:5001/api
```

Change the host and port to match `BASE_URL` and `PORT` in the active environment file.

## Request and Response Conventions

Send JSON requests with `Content-Type: application/json`. File-upload routes use `multipart/form-data` and the exact file field name shown for that endpoint.

All successful routes except `GET /health` return HTTP `200` with this envelope:

```json
{
  "message": "Route-specific success message",
  "data": {}
}
```

`GET /health` responds directly with:

```json
{
  "status": "ok",
  "timestamp": "2026-09-08T12:00:00.000Z"
}
```

List routes return a Mongoose pagination result in `data`, including `docs`, `totalDocs`, `limit`, `page`, `totalPages`, and next/previous-page metadata.

### Errors

Authorization middleware returns HTTP `401` with a JSON string such as `"Access Denied"`, `"Invalid Token"`, or `"User not allowed to access this resource"`. Service and validation errors return a JSON `{ "message": "..." }` body with their HTTP status. Unexpected server errors return `500` with `{ "message": "Internal server error" }`. Rate-limited requests return `429` with a JSON message.

### Authentication and Roles

Protected routes require this header:

```http
Authorization: Bearer <access-token>
```

The API recognizes these role values:

| Role          | Value   |
| ------------- | ------- |
| Administrator | `Admin` |
| Staff member  | `staff` |

Access tokens and refresh tokens are purpose-bound JWTs signed with HS256, issuer, and audience claims. Protected routes accept only access tokens. `/auth/refresh-token` and `/auth/sign-out` accept only refresh tokens in the same Bearer header format. Existing sessions from before this change require a new login.

### Upload Rules

All upload fields accept only `image/png`, `image/jpg`, and `image/jpeg`, with a maximum file size of 419,430 bytes (about 409 KB). The field names differ by endpoint: `image`, `file`, or `photo`.

### Validation Terminology

An `ID` is sent as a string. The Joi schemas require a non-empty string; services may additionally reject an invalid database identifier. Fields marked required are required by the current validation or route implementation.

## Endpoint Summary

| Method | Endpoint                                   | Auth                  |
| ------ | ------------------------------------------ | --------------------- |
| GET    | `/health`                                  | `X-API-Key`           |
| POST   | `/auth/login`                              | `X-API-Key`           |
| POST   | `/auth/refresh-token`                      | Refresh token         |
| POST   | `/auth/sign-out`                           | Refresh token         |
| POST   | `/user/addUser`                            | Admin                 |
| GET    | `/user/displaystaff`                       | Admin                 |
| GET    | `/user/display-staff/:id`                  | Admin or staff        |
| PUT    | `/user/profile-edit`                       | Admin or staff        |
| PUT    | `/user/user-status-change`                 | Admin                 |
| GET    | `/user/info`                               | Admin or staff        |
| POST   | `/category/add-category`                   | Admin                 |
| GET    | `/category/`                               | `X-API-Key`           |
| GET    | `/category/:id`                            | Admin or staff        |
| PUT    | `/category/edit-category`                  | Admin                 |
| PUT    | `/category/update-status`                  | Admin                 |
| POST   | `/product/add`                             | Admin                 |
| GET    | `/product/`                                | Admin or staff        |
| GET    | `/product/online`                          | `X-API-Key`           |
| GET    | `/product/:id`                             | `X-API-Key`           |
| PUT    | `/product/add-multiple-image/:productId`   | Admin or staff        |
| DELETE | `/product/delete-multiple-image`           | Admin or staff        |
| PUT    | `/product/edit-details`                    | Admin or staff        |
| PUT    | `/product/edit-variant`                    | Admin or staff        |
| PUT    | `/product/status-change`                   | Admin                 |
| GET    | `/product/related-product/:categoryId`     | `X-API-Key`           |
| POST   | `/city/add`                                | Admin                 |
| GET    | `/city/`                                   | Admin or staff        |
| GET    | `/city/web`                                | `X-API-Key`           |
| GET    | `/city/:id`                                | `X-API-Key`           |
| PUT    | `/city/edit`                               | Admin                 |
| PUT    | `/city/edit-status`                        | Admin                 |
| POST   | `/order/add-order`                         | `X-API-Key`           |
| GET    | `/order/`                                  | Admin or staff        |
| GET    | `/order/:orderId`                          | Customer access token |
| GET    | `/order/admin/:orderId`                    | Admin or staff        |
| PUT    | `/order/cancel/:orderId`                   | Admin or staff        |
| PUT    | `/order/complete/:orderId`                 | Admin or staff        |
| GET    | `/dashboard/admin/order-status-count`      | Admin                 |
| GET    | `/dashboard/admin/income-summary`          | Admin                 |
| GET    | `/dashboard/admin/order-performance-chart` | Admin                 |
| GET    | `/dashboard/admin/product-sale`            | Admin                 |
| GET    | `/online-payment/config`                   | `X-API-Key`           |
| POST   | `/online-payment/webhook`                  | Stripe signature      |
| GET    | `/mail/`                                   | Admin                 |

## Health

### GET `/health`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Parameters and payload:** None.

**Success response:** `200` with `status: "ok"` and an ISO-8601 `timestamp`.

## Authentication

### POST `/auth/login`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Payload:** JSON.

| Field      | Type   | Validation                       |
| ---------- | ------ | -------------------------------- |
| `email`    | string | Required; valid email address.   |
| `password` | string | Required; maximum 40 characters. |

**Success response:** `200`; `data` contains the authenticated user session, including purpose-bound `accessToken`, `refreshToken`, user ID, user name, role, and status.

### GET `/auth/refresh-token`

**Authentication:** `Authorization: Bearer <refresh-token>`.

**Parameters and payload:** None.

**Success response:** `200`; `data` contains replacement `accessToken` and `refreshToken` values.

### POST `/auth/sign-out`

**Authentication:** `Authorization: Bearer <refresh-token>`.

**Parameters and payload:** None.

**Success response:** `200` with `message: "Successfully sign out"` and no `data` property.

## Users

### POST `/user/addUser`

**Authentication:** Admin.

**Payload:** `multipart/form-data`.

| Field       | Type       | Validation                                     |
| ----------- | ---------- | ---------------------------------------------- |
| `image`     | image file | Required; must follow the shared upload rules. |
| `firstName` | string     | Required; 2 to 100 characters.                 |
| `lastName`  | string     | Required; 2 to 100 characters.                 |
| `email`     | string     | Required; valid email address.                 |
| `branch`    | string     | Required; 2 to 100 characters.                 |

**Success response:** `200`; `data` is the created staff user record.

### GET `/user/displaystaff`

**Authentication:** Admin.

**Query parameters:** `page`, `per_page`, `search` (first name), and `branch` are optional list filters.

**Success response:** `200`; `data` is a paginated staff-user result.

### GET `/user/display-staff/:id`

**Authentication:** Admin or staff.

**Path parameters:** `id` is the user ID.

**Success response:** `200`; `data` is the requested user record.

### PUT `/user/profile-edit`

**Authentication:** Admin or staff.

**Payload:** `multipart/form-data`.

| Field              | Type                 | Validation                                                                                       |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------ |
| `userId`           | string               | Required user ID.                                                                                |
| `firstName`        | string               | Required; 2 to 100 characters.                                                                   |
| `lastName`         | string               | Required; 2 to 100 characters.                                                                   |
| `email`            | string               | Required; valid email address.                                                                   |
| `branch`           | string               | Required; 2 to 100 characters.                                                                   |
| `isActivePassword` | boolean              | Required.                                                                                        |
| `oldPassword`      | string               | Required when `isActivePassword` is `true`.                                                      |
| `newPassword`      | string               | Required when `isActivePassword` is `true`.                                                      |
| `image`            | image file or string | Upload a replacement image file, or send the existing image URL string when no file is uploaded. |

**Success response:** `200`; `data` is the profile update result.

### PUT `/user/user-status-change`

**Authentication:** Admin.

**Payload:** JSON.

| Field        | Type   | Validation                                         |
| ------------ | ------ | -------------------------------------------------- |
| `userId`     | string | Required user ID.                                  |
| `userStatus` | string | Required; use `Active`, `Inactive`, or `Rejected`. |

**Success response:** `200`; `data` is the user-status update result.

### GET `/user/info`

**Authentication:** Admin or staff.

**Parameters and payload:** None.

**Success response:** `200`; `data` is the current user's profile.

## Categories

### POST `/category/add-category`

**Authentication:** Admin.

**Payload:** `multipart/form-data`.

| Field          | Type       | Validation                                     |
| -------------- | ---------- | ---------------------------------------------- |
| `file`         | image file | Required; must follow the shared upload rules. |
| `categoryName` | string     | Required; maximum 100 characters.              |
| `description`  | string     | Required; 5 to 1,000 characters.               |

**Success response:** `200`; `data` is the created category record, including its generated slug and image URL.

### GET `/category/`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Query parameters:** Optional `page`, `per_page`, `search` (category name), `slug`, and `status` (category status).

**Success response:** `200`; `data` is a paginated category result.

### GET `/category/:id`

**Authentication:** Admin or staff.

**Path parameters:** `id` is the category ID.

**Success response:** `200`; `data` is the requested category record.

### PUT `/category/edit-category`

**Authentication:** Admin.

**Payload:** `multipart/form-data`.

| Field          | Type                 | Validation                                                                                       |
| -------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `categoryId`   | string               | Required category ID.                                                                            |
| `categoryName` | string               | Required; maximum 100 characters.                                                                |
| `description`  | string               | Required; 5 to 1,000 characters.                                                                 |
| `photo`        | image file or string | Upload a replacement image file, or send the existing image URL string when no file is uploaded. |

**Success response:** `200`; `data` is the category update result.

### PUT `/category/update-status`

**Authentication:** Admin.

**Payload:** JSON.

| Field        | Type   | Validation                              |
| ------------ | ------ | --------------------------------------- |
| `categoryId` | string | Required category ID.                   |
| `status`     | string | Required; use `Active` or `Deactivate`. |

**Success response:** `200`; `data` is the category-status update result.

## Products

### POST `/product/add`

**Authentication:** Admin.

**Payload:** `multipart/form-data`.

| Field                   | Type       | Validation                                                                         |
| ----------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `image`                 | image file | Required; must follow the shared upload rules.                                     |
| `productName`           | string     | Required.                                                                          |
| `categoryId`            | string     | Required category ID.                                                              |
| `primaryDescription`    | string     | Required; 5 to 500 characters.                                                     |
| `secondaryDescription`  | string     | Required; 5 to 1,500 characters.                                                   |
| `variant`               | array      | Optional in the Joi schema. Each supplied item must follow the nested rules below. |
| `variant[].variantName` | string     | Required; maximum 50 characters.                                                   |
| `variant[].stock`       | number     | Required; integer-like value from 1 to 100.                                        |
| `variant[].price`       | number     | Required; from 1 to 999,999.                                                       |
| `variant[].cost`        | number     | Required; must be less than that item's `price`.                                   |

**Success response:** `200`; `data` is the created product record, including generated `productCode`, slug, primary image, and variant references.

### GET `/product/`

**Authentication:** Admin or staff.

**Query parameters:** Optional `page`, `per_page`, `search` (product name), `slug`, and `status` (product status).

**Success response:** `200`; `data` is a paginated product result with category and variant information.

### GET `/product/online`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Query parameters:** Optional `page`, `per_page`, `search`, `slug`, `priceMin`, `PriceMax`, and `categoryId`. `categoryId` may be a comma-separated list of category IDs. Note the implemented parameter name is `PriceMax` with a capital `P`.

**Success response:** `200`; `data` is a paginated public-product result.

### GET `/product/:id`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Path parameters:** `id` is the product ID.

**Success response:** `200`; `data` is the requested product with its category and variants.

### PUT `/product/add-multiple-image/:productId`

**Authentication:** Admin or staff.

**Payload:** `multipart/form-data` with one or more `image` files.

**Path parameters:** `productId` is the product ID.

**Validation:** Each file follows the shared upload rules. The total image set for a product is capped by `MAX_IMAGE_SET_COUNT` from the environment.

**Success response:** `200`; `data` is the multiple-image update result.

### DELETE `/product/delete-multiple-image`

**Authentication:** Admin or staff.

**Query parameters:** Required `productId` and `imageId` strings.

**Success response:** `200`; `data` is the deleted image result.

### PUT `/product/edit-details`

**Authentication:** Admin or staff.

**Payload:** `multipart/form-data`.

| Field                  | Type                 | Validation                                                                                       |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `productId`            | string               | Required product ID.                                                                             |
| `productName`          | string               | Required.                                                                                        |
| `categoryId`           | string               | Required category ID.                                                                            |
| `primaryDescription`   | string               | Required; maximum 500 characters.                                                                |
| `secondaryDescription` | string               | Required; maximum 1,500 characters.                                                              |
| `image`                | image file or string | Upload a replacement image file, or send the existing image URL string when no file is uploaded. |

**Success response:** `200`; `data` is the product-details update result.

### PUT `/product/edit-variant`

**Authentication:** Admin.

**Payload:** JSON.

| Field           | Type   | Validation                           |
| --------------- | ------ | ------------------------------------ |
| `productId`     | string | Required product ID.                 |
| `variantId`     | string | Required variant ID.                 |
| `variantName`   | string | Required.                            |
| `stock`         | number | Required; 0 to 100.                  |
| `price`         | number | Required; 1 to 999,999.              |
| `discountPrice` | number | Required; must be less than `price`. |
| `cost`          | number | Required; must be less than `price`. |

**Success response:** `200`; `data` is the variant update result.

### PUT `/product/status-change`

**Authentication:** Public in the current router implementation.

**Payload:** JSON.

| Field       | Type   | Validation                                                                         |
| ----------- | ------ | ---------------------------------------------------------------------------------- |
| `ProductId` | string | Required product ID. The capital `P` is required by the current validation schema. |
| `status`    | string | Required; use `Active`, `Deactivate`, or `Reject`.                                 |

**Success response:** `200`; `data` is the product-status update result.

### GET `/product/related-product/:categoryId`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Path parameters:** `categoryId` is the category ID.

**Success response:** `200`; `data` is the list of related products.

## Cities

### POST `/city/add`

**Authentication:** Admin.

**Payload:** JSON.

| Field            | Type   | Validation             |
| ---------------- | ------ | ---------------------- |
| `cityName`       | string | Required.              |
| `deliverCharges` | number | Required; maximum 999. |

**Success response:** `200`; `data` is the created city record. The database schema stores `deliverCharges` as a string even though request validation expects a number.

### GET `/city/`

**Authentication:** Admin or staff.

**Query parameters:** Optional `page`, `per_page`, `search` (city name), and `status`.

**Success response:** `200`; `data` is a paginated city result.

### GET `/city/web`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Parameters and payload:** None.

**Success response:** `200`; `data` is the list of active cities.

### GET `/city/:id`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Path parameters:** `id` is the city ID.

**Success response:** `200`; `data` is the requested city result.

### PUT `/city/edit`

**Authentication:** Admin.

**Payload:** JSON.

| Field            | Type   | Validation             |
| ---------------- | ------ | ---------------------- |
| `cityId`         | string | Required city ID.      |
| `cityName`       | string | Required.              |
| `deliverCharges` | number | Required; maximum 999. |

**Success response:** `200`; `data` is the city update result.

### PUT `/city/edit-status`

**Authentication:** Admin.

**Payload:** JSON.

| Field    | Type   | Validation                              |
| -------- | ------ | --------------------------------------- |
| `cityId` | string | Required city ID.                       |
| `status` | string | Required; use `Active` or `Deactivate`. |

**Success response:** `200`; `data` is the city-status update result.

## Orders

### POST `/order/add-order`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Payload:** JSON.

| Field                 | Type   | Validation                                     |
| --------------------- | ------ | ---------------------------------------------- |
| `firstName`           | string | Required; maximum 100 characters.              |
| `lastName`            | string | Required; maximum 100 characters.              |
| `email`               | string | Required; valid email; maximum 100 characters. |
| `phoneNumber`         | string | Required; maximum 100 characters.              |
| `address1`            | string | Required; maximum 100 characters.              |
| `address2`            | string | Required; maximum 100 characters.              |
| `cityId`              | string | Required city ID.                              |
| `paymentMethod`       | string | Required; use `Online` or `Cash`.              |
| `product`             | array  | Required.                                      |
| `product[].variantId` | string | Required variant ID.                           |
| `product[].productId` | string | Required product ID.                           |
| `product[].qty`       | number | Required; minimum 1.                           |

**Rate limit:** 10 checkout attempts per IP every 15 minutes.

**Success response:** `200`; `data` contains a customer-safe order, a cryptographically random `orderAccessToken`, and, for online payments only, `clientSecret`. The client secret is returned only in this direct checkout response and is not stored with the order. Cash orders start in processing status; online orders start pending. The service calculates totals from server-side product and delivery data.

### GET `/order/`

**Authentication:** Admin or staff.

**Query parameters:** Optional `page`, `per_page`, `search` (order ID), and `status` (order status).

**Success response:** `200`; `data` is a paginated, populated order result.

### GET `/order/:orderId`

**Authentication:** Customer access token.

**Path parameters:** `orderId` is the generated order reference, such as `Inv-...`, not the MongoDB `_id`.

**Headers:** Required `X-Order-Access-Token: <orderAccessToken>` returned by `POST /order/add-order`.

**Rate limit:** 60 lookup attempts per IP every 15 minutes.

**Success response:** `200`; `data` is the requested customer order. Payment information, internal profit, product cost, and the stored token hash are excluded. Orders created before customer access tokens were introduced must be retrieved through an authenticated staff/admin endpoint.

### GET `/order/admin/:orderId`

**Authentication:** Admin or staff.

**Path parameters:** `orderId` is the generated order reference.

**Success response:** `200`; `data` is the requested administrative order view, including internal order details.

### PUT `/order/cancel/:orderId`

**Authentication:** Admin or staff.

**Path parameters:** `orderId` is the generated order reference.

**Success response:** `200`; `data` is the update result and the order status becomes `Reject`.

### PUT `/order/complete/:orderId`

**Authentication:** Admin or staff.

**Path parameters:** `orderId` is the generated order reference.

**Success response:** `200`; `data` is the update result and the order status becomes `Complete`.

## Dashboard

All dashboard endpoints require Admin authentication and these query parameters:

| Field       | Type          | Validation                                                             |
| ----------- | ------------- | ---------------------------------------------------------------------- |
| `startDate` | ISO-8601 date | Required.                                                              |
| `endDate`   | ISO-8601 date | Required; cannot be before `startDate` or more than one year after it. |

### GET `/dashboard/admin/order-status-count`

**Success response:** `200`; `data` includes status counts for processing, pending, complete, and rejected orders plus the applied date range.

### GET `/dashboard/admin/income-summary`

**Success response:** `200`; `data` includes total income, income by payment method, and the applied date range. Pending and rejected orders are excluded.

### GET `/dashboard/admin/order-performance-chart`

**Success response:** `200`; `data` includes daily order counts, total order amount, payment summary, and the applied date range.

### GET `/dashboard/admin/product-sale`

**Success response:** `200`; `data` includes products sold (`productCode`, `productName`, and quantity) and the applied date range.

## Online Payments

### GET `/online-payment/config`

**Authentication:** `X-API-Key` header matching `PUBLIC_API_KEY`.

**Parameters and payload:** None. The API key is required even though the Stripe publishable key is safe to expose to the client.

**Success response:** `200`; `data.publishableKey` contains the Stripe publishable key.

### POST `/online-payment/webhook`

**Authentication:** Stripe webhook signature.

**Headers:** Required `stripe-signature` generated by Stripe.

**Payload:** Raw `application/json` Stripe event body. Do not transform or JSON-encode the body again; signature verification requires the original raw bytes.

**Success response:** `200`; `data` contains the webhook service result. The API verifies the Stripe signature against the unmodified raw body, checks the configured live/test mode, matches the PaymentIntent ID, amount, and currency to a pending online order, and records the Stripe event ID to make repeat deliveries idempotent.

- `payment_intent.succeeded` changes the related order to `Processing` after amount and currency verification.
- `payment_intent.payment_failed` and `payment_intent.canceled` reject the pending order and restore its reserved stock.
- Repeat webhook deliveries are acknowledged without changing the order or restoring stock twice.
- Stale pending orders are recovered by the scheduled job after `PAYMENT_PENDING_TIMEOUT_MINUTES`; eligible Stripe PaymentIntents are canceled and the reserved stock is restored.

## Mail

### GET `/mail/`

**Authentication:** Admin.

**Parameters and payload:** None.

**Success response:** `200`; `data` contains the result returned by the configured staff-registration email service.

## Security Notes

- Product mutations require a valid access token. Image deletion, product details, and variant edits permit Admin or staff; product status changes require Admin.
- Customer order data requires the high-entropy `X-Order-Access-Token` returned only at checkout. Keep it out of URLs, logs, and analytics.
- Stripe client secrets and raw webhook events are not persisted. Run `CONFIRM_PAYMENT_DATA_REDACTION=true npm run security:redact-payment-data` once per affected environment to remove legacy data.
- Browser requests are restricted to `WEB_BASE_URL`; production deployments must use HTTPS and configure `STRIPE_LIVE_MODE=true` for live Stripe events.
- Cancel and complete order operations use `PUT`; clients must update from the former `GET` endpoints.
- Failed and canceled Stripe PaymentIntents release reserved stock. A scheduled recovery checks stale pending orders after `PAYMENT_PENDING_TIMEOUT_MINUTES` and releases stock for abandoned PaymentIntents.
- Configure `FORCE_HTTPS=true` behind a TLS reverse proxy, or set `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH` for native TLS. Never commit certificate or private-key files.
- Never put JWT secrets, database credentials, Cloudinary credentials, Stripe secret keys, SMTP passwords, or production environment files in source control. Rotate the credentials that were previously stored in source code.
