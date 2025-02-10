"use strict";

const constants = {
  environment: {
    LOCAL: "local",
    DEVELOPMENT: "development",
    TEST: "test",
    PRODUCTION: "production",
  },
  http: {
    status: {
      OK: 200,
      CREATED: 201,
      ACCEPTED: 202,
      NOCONTENT: 204,
      MULTI_STATUS: 207,
      REDIRECT: 301,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      CONFLICT: 409,
      INTERNAL_SERVER_ERROR: 500,
      NOT_FOUND: 404,
    },
  },
  error: {
    validation: {},
    message: {
      // HTTP Status code messages
      HTTP_STATUS_CODE_201: "Created",
      HTTP_STATUS_CODE_400: "Bad Request.",
      HTTP_STATUS_CODE_301: "Redirect to other url",
      HTTP_STATUS_CODE_401: "Unauthorized.",
      HTTP_STATUS_CODE_403: "Forbidden.",
      HTTP_STATUS_CODE_404: "The specified resource was not found.",
      HTTP_STATUS_CODE_409: "Resource already exists",
      HTTP_STATUS_CODE_500: "Internal Server Error.",
      INVALID_LOGIN: "Invalid Login",
      EMAIL_MISSING: "Email Missing",
      PAYMENT_ACCOUNT_ID_MISSING: "Payment Account Id Missing",
      INVALID_PAYMENT_ACCOUNT_ID: "Invalid Payment Account Id provided",
    },
  },
  models: {
    USER_TABLE: "users",
    OTP_TABLE: "otps",
    ADMIN_TABLE: "admins",
    CUSTOMER_TABLE: "customers",
    SECTOR_TABLE: "sectors",
    SHARE_TABLE: "shares",
    SHARE_PRICE_HISTORY_TABLE: "share_price_histories",
    EVENT_TABLE: "events",
    PROMOTER_TABLE: "promoters",
    IPO_TABLE: "ipos",
    INVESTMENT_TABLE: "investments",
    TRANSACTION_TABLE: "transactions",
    BLOG_TABLE: "blogs",
    ENQUIRY_TABLE: "enquiries",
    QUERY_TABLE: "queries",
    ENQUIRY_TABLE: "enquiries",
    COMMENT_TABLE: "comments",
  },
  bcrypt: {
    SALT_ROUNDS: 10,
  },
  time: {
    // TOKEN_EXPIRES_IN: 1000 * 60 * 60 * 24 * 30,
    TOKEN_EXPIRES_IN: 1000 * 60 * 15,
    REFRESH_TOKEN_EXPIRES_IN: "20d",
  },
  mime: {
    imageMime: ["jpeg", "jpg", "png", "gif", "webp"],
    videoMime: ["mp4", "mpeg", "ogg", "webm", "m4v", "mov", "mkv"],
    docsMime: [
      "pdf",
      "ppt",
      "pptx",
      "docx",
      "application/msword",
      "msword",
      "vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  static: {
    slotInterval: 10,
  },
};

export default constants;
