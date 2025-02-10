"use strict";
import userModel from "./models/user.model.js";
import otpModel from "./models/otp.model.js";
import adminModel from "./models/admin.model.js";
import sectorModel from "./models/sector.model.js";
import shareModel from "./models/share.model.js";
import sharePriceHistoryModel from "./models/share-price-history.model.js";
import eventModel from "./models/event.model.js";
import ipoModel from "./models/ipo.model.js";
import customerModel from "./models/customer.model.js";
import investmentModel from "./models/investment.model.js";
import transactionModel from "./models/transaction.model.js";
import blogModel from "./models/blog.model.js";
import queryModel from "./models/query.model.js";
import commentModel from "./models/comment.model.js";
import enquiryModel from "./models/enquiry.model.js";

export default {
  UserModel: userModel,
  OTPModel: otpModel,
  AdminModel: adminModel,
  SectorModel: sectorModel,
  OTPModel: otpModel,
  ShareModel: shareModel,
  SharePriceHistoryModel: sharePriceHistoryModel,
  EventModel: eventModel,
  IPOModel: ipoModel,
  CustomerModel: customerModel,
  InvestmentModel: investmentModel,
  TransactionModel: transactionModel,
  BlogModel: blogModel,
  QueryModel: queryModel,
  CommentModel: commentModel,
  EnquiryModel: enquiryModel,
};
