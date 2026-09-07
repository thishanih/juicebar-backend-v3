# API Reference

This reference documents the Express routes currently mounted by the application. Authentication labels reflect the middleware that is present in the code, including routes that are presently public.

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

Authorization middleware returns HTTP `401` with a JSON string such as `"Access Denied"`, `"Invalid Token"`, or `"User not allowed to access this resource"`. Errors forwarded from routes and services are currently handled as HTTP `500` plain-text responses. Validate client responses by status code before assuming a JSON body.

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

`/auth/refresh-token` and `/auth/sign-out` accept a refresh token in the same Bearer header format, but do not use the standard role middleware.

### Upload Rules

All upload fields accept only `image/png`, `image/jpg`, and `image/jpeg`, with a maximum file size of 419,430 bytes (about 409 KB). The field names differ by endpoint: `image`, `file`, or `photo`.

### Validation Terminology

An `ID` is sent as a string. The Joi schemas require a non-empty string; services may additionally reject an invalid database identifier. Fields marked required are required by the current validation or route implementation.

## Endpoint Summary

| Method | Endpoint                                   | Auth             |
| ------ | ------------------------------------------ | ---------------- |
| GET    | `/health`                                  | Public           |
| POST   | `/auth/login`                              | Public           |
| GET    | `/auth/refresh-token`                      | Refresh token    |
| POST   | `/auth/sign-out`                           | Refresh token    |
| POST   | `/user/addUser`                            | Admin            |
| GET    | `/user/displaystaff`                       | Admin            |
| GET    | `/user/display-staff/:id`                  | Admin or staff   |
| PUT    | `/user/profile-edit`                       | Admin or staff   |
| PUT    | `/user/user-status-change`                 | Admin            |
| GET    | `/user/info`                               | Admin or staff   |
| POST   | `/category/add-category`                   | Admin            |
| GET    | `/category/`                               | Public           |
| GET    | `/category/:id`                            | Admin or staff   |
| PUT    | `/category/edit-category`                  | Admin            |
| PUT    | `/category/update-status`                  | Admin            |
| POST   | `/product/add`                             | Admin            |
| GET    | `/product/`                                | Admin or staff   |
| GET    | `/product/online`                          | Public           |
| GET    | `/product/:id`                             | Public           |
| PUT    | `/product/add-multiple-image/:productId`   | Admin or staff   |
| DELETE | `/product/delete-multiple-image`           | Public           |
| PUT    | `/product/edit-details`                    | Public           |
| PUT    | `/product/edit-variant`                    | Public           |
| PUT    | `/product/status-change`                   | Public           |
| GET    | `/product/related-product/:categoryId`     | Public           |
| POST   | `/product-token/add`                       | Admin            |
| GET    | `/product-token/`                          | Public           |
| PUT    | `/product-token/edit`                      | Admin            |
| PUT    | `/product-token/edit-status`               | Admin            |
| POST   | `/city/add`                                | Admin            |
| GET    | `/city/`                                   | Admin or staff   |
| GET    | `/city/web`                                | Public           |
| GET    | `/city/:id`                                | Public           |
| PUT    | `/city/edit`                               | Admin            |
| PUT    | `/city/edit-status`                        | Admin            |
| POST   | `/order/add-order`                         | Public           |
| GET    | `/order/`                                  | Admin or staff   |
| GET    | `/order/:orderId`                          | Public           |
| GET    | `/order/admin/:orderId`                    | Admin or staff   |
| GET    | `/order/cancel/:orderId`                   | Admin or staff   |
| GET    | `/order/complete/:orderId`                 | Admin or staff   |
| GET    | `/dashboard/admin/order-status-count`      | Admin            |
| GET    | `/dashboard/admin/income-summary`          | Admin            |
| GET    | `/dashboard/admin/order-performance-chart` | Admin            |
| GET    | `/dashboard/admin/product-sale`            | Admin            |
| GET    | `/online-payment/config`                   | Public           |
| POST   | `/online-payment/webhook`                  | Stripe signature |
| GET    | `/mail/`                                   | Public           |

## Health

### GET `/health`

**Authentication:** Public.

**Parameters and payload:** None.

**Success response:** `200` with `status: "ok"` and an ISO-8601 `timestamp`.

## Authentication

### POST `/auth/login`

**Authentication:** Public.

**Payload:** JSON.

| Field      | Type   | Validation                       |
| ---------- | ------ | -------------------------------- |
| `email`    | string | Required; valid email address.   |
| `password` | string | Required; maximum 40 characters. |

**Success response:** `200`; `data` contains the authenticated user session, including `accessToken`, `refreshToken`, user ID, user name, role, and status.

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

**Authentication:** Public.

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

**Authentication:** Public.

**Query parameters:** Optional `page`, `per_page`, `search`, `slug`, `priceMin`, `PriceMax`, and `categoryId`. `categoryId` may be a comma-separated list of category IDs. Note the implemented parameter name is `PriceMax` with a capital `P`.

**Success response:** `200`; `data` is a paginated public-product result.

### GET `/product/:id`

**Authentication:** Public.

**Path parameters:** `id` is the product ID.

**Success response:** `200`; `data` is the requested product with its category and variants.

### PUT `/product/add-multiple-image/:productId`

**Authentication:** Admin or staff.

**Payload:** `multipart/form-data` with one or more `image` files.

**Path parameters:** `productId` is the product ID.

**Validation:** Each file follows the shared upload rules. The total image set for a product is capped by `MAX_IMAGE_SET_COUNT` from the environment.

**Success response:** `200`; `data` is the multiple-image update result.

### DELETE `/product/delete-multiple-image`

**Authentication:** Public in the current router implementation.

**Query parameters:** Required `productId` and `imageId` strings.

**Success response:** `200`; `data` is the deleted image result.

### PUT `/product/edit-details`

**Authentication:** Public in the current router implementation.

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

**Authentication:** Public in the current router implementation.

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

**Authentication:** Public.

**Path parameters:** `categoryId` is the category ID.

**Success response:** `200`; `data` is the list of related products.

## Product Tokens

### POST `/product-token/add`

**Authentication:** Admin.

**Payload:** JSON with required string field `name`.

**Success response:** `200`; `data` is the created product-token record.

### GET `/product-token/`

**Authentication:** Public.

**Query parameters:** Optional `page`, `per_page`, `search` (name), and `status`.

**Success response:** `200`; `data` is a paginated product-token result.

### PUT `/product-token/edit`

**Authentication:** Admin.

**Payload:** JSON.

| Field     | Type   | Validation                 |
| --------- | ------ | -------------------------- |
| `tokenId` | string | Required product-token ID. |
| `name`    | string | Required.                  |

**Success response:** `200`; `data` is the product-token update result.

### PUT `/product-token/edit-status`

**Authentication:** Admin.

**Payload:** JSON.

| Field     | Type   | Validation                              |
| --------- | ------ | --------------------------------------- |
| `tokenId` | string | Required product-token ID.              |
| `status`  | string | Required; use `Active` or `Deactivate`. |

**Success response:** `200`; `data` is the product-token-status update result.

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

**Authentication:** Public.

**Parameters and payload:** None.

**Success response:** `200`; `data` is the list of active cities.

### GET `/city/:id`

**Authentication:** Public.

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

**Authentication:** Public.

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

**Success response:** `200`; `data` is the created order. Online payments produce a pending order and payment client secret; cash orders start in processing status. The service calculates totals, reduces stock, and stores product pricing details.

### GET `/order/`

**Authentication:** Admin or staff.

**Query parameters:** Optional `page`, `per_page`, `search` (order ID), and `status` (order status).

**Success response:** `200`; `data` is a paginated, populated order result.

### GET `/order/:orderId`

**Authentication:** Public.

**Path parameters:** `orderId` is the generated order reference, such as `Inv-...`, not the MongoDB `_id`.

**Success response:** `200`; `data` is the requested customer order. Internal cost and profit data are excluded by the service.

### GET `/order/admin/:orderId`

**Authentication:** Admin or staff.

**Path parameters:** `orderId` is the generated order reference.

**Success response:** `200`; `data` is the requested administrative order view, including internal order details.

### GET `/order/cancel/:orderId`

**Authentication:** Admin or staff.

**Path parameters:** `orderId` is the generated order reference.

**Success response:** `200`; `data` is the update result and the order status becomes `Reject`.

### GET `/order/complete/:orderId`

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

**Authentication:** Public.

**Parameters and payload:** None.

**Success response:** `200`; `data.publishableKey` contains the Stripe publishable key.

### POST `/online-payment/webhook`

**Authentication:** Stripe webhook signature.

**Headers:** Required `stripe-signature` generated by Stripe.

**Payload:** Raw `application/json` Stripe event body. Do not transform or JSON-encode the body again; signature verification requires the original raw bytes.

**Success response:** `200`; `data` contains the webhook service result. A successful payment intent updates the related order's status to `Processing`.

## Mail

### GET `/mail/`

**Authentication:** Public.

**Parameters and payload:** None.

**Success response:** `200`; `data` contains the result returned by the configured staff-registration email service.

## Security Notes

- `DELETE /product/delete-multiple-image`, `PUT /product/edit-details`, `PUT /product/edit-variant`, and `PUT /product/status-change` are public in the current router implementation. Clients should not assume these mutations require an access token.
- The cancel and complete order operations mutate state but are implemented as `GET` requests. Avoid browser or proxy prefetching for those URLs.
- Never put JWT secrets, database credentials, Stripe secret keys, SMTP passwords, or production environment files in source control.
