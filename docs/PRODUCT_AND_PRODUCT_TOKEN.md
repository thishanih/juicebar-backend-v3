# Product and Product Token

This document explains the purpose of the product and product-token parts of the API.

## General Request Flow

Requests follow this path:

```text
HTTP request
    -> apiRouter
    -> productRouter or productTokenRouter
    -> authorization middleware, when required
    -> route handler
    -> service
    -> Mongoose model and database
    -> JSON response
```

The router files are currently located in `src/controllers/`, although they contain
both route definitions and request handlers.

## Product

Products are the items sold by the application. A product can have a category,
description, images, variants, prices, and a product status.

The product routes are mounted with this prefix:

```js
apiRouter.use("/product", productRouter);
```

The route handlers are in `src/controllers/product.controller.js`. Their business
logic is in `src/services/product.service.js`, which uses the product, variant, and
category models.

### Product Endpoints

| Method   | Endpoint                                 | Purpose                                                         | Access       |
| -------- | ---------------------------------------- | --------------------------------------------------------------- | ------------ |
| `POST`   | `/product/add`                           | Add a product, upload its main image, and create its variants   | Admin        |
| `GET`    | `/product`                               | Display products for the admin area with pagination and filters | Admin, staff |
| `GET`    | `/product/online`                        | Display active products for the website                         | Public       |
| `GET`    | `/product/:id`                           | Display one product by ID                                       | Public       |
| `PUT`    | `/product/add-multiple-image/:productId` | Add more images to a product                                    | Admin, staff |
| `DELETE` | `/product/delete-multiple-image`         | Delete product images                                           | Admin, staff |
| `PUT`    | `/product/edit-details`                  | Edit product information and optionally its image               | Admin, staff |
| `PUT`    | `/product/edit-variant`                  | Edit a product variant                                          | Admin, staff |
| `PUT`    | `/product/status-change`                 | Change product status                                           | Admin        |
| `GET`    | `/product/related-product/:categoryId`   | Display related products in a category                          | Public       |

Product operations are implemented by functions such as:

- `addProductService`
- `displayProduct`
- `displayOnlineProduct`
- `displayByIdProduct`
- `editProductDetailsService`
- `editProductVariantService`
- `productStatusChange`

## Product Token

A product token is a reusable named value associated with product-token data. In
this application, product tokens can be created, listed, edited, and enabled or
disabled. They are separate from products and have their own MongoDB model:
`ProductTokenModel`.

The product-token routes are mounted with this prefix:

```js
apiRouter.use("/product-token", productTokenRouter);
```

The route handlers are in `src/controllers/productToken.controller.js`. Their
business logic is in `src/services/productToken.service.js`.

### Product Token Endpoints

| Method | Endpoint                     | Purpose                                         | Access |
| ------ | ---------------------------- | ----------------------------------------------- | ------ |
| `POST` | `/product-token/add`         | Create a product token                          | Admin  |
| `GET`  | `/product-token`             | List product tokens with pagination and filters | Public |
| `PUT`  | `/product-token/edit`        | Rename or edit a product token                  | Admin  |
| `PUT`  | `/product-token/edit-status` | Change a product token's status                 | Admin  |

Product-token operations are implemented by:

- `addProductTokenService`
- `displayProductToken`
- `editProductTokenService`
- `updatedStatusProductTokenService`

## Difference Between Product and Product Token

| Product                                                       | Product token                                           |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| Represents an item sold in the store                          | Represents a separate named token record                |
| Contains descriptions, images, category, variants, and prices | Contains a name and status                              |
| Uses `ProductModel` and `variantModel`                        | Uses `ProductTokenModel`                                |
| Supports image and variant management                         | Supports only create, list, edit, and status management |

If the application is mounted at `/api`, the full URL for adding a product is
`POST /api/product/add`, and the full URL for adding a product token is
`POST /api/product-token/add`.
