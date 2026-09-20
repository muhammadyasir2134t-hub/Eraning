import { pgTable, text, timestamp, boolean, integer, numeric, uuid, pgEnum } from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "available",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "paid"
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "task_earning",
  "withdrawal",
  "referral_bonus",
  "service_fee",
  "adjustment"
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "cancelled"
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "processing",
  "completed",
  "rejected"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "easypaisa",
  "jazzcash",
  "bank_transfer"
]);

// 1. Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  passwordHash: text("password_hash").notNull(),
  referralCode: text("referral_code").notNull(),
  referredBy: text("referred_by"),
  role: text("role").default("performer").notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(),
  isVerified: boolean("is_verified").default(true).notNull(),
  otpCode: text("otp_code"),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  city: text("city"),
  country: text("country").default("Pakistan"),
  skills: text("skills"), // comma separated or JSON string
  education: text("education"),
  idDocumentType: text("id_document_type"), // CNIC, Passport
  idDocumentNumber: text("id_document_number"),
  isKycVerified: boolean("is_kyc_verified").default(false).notNull(),
  notificationPreferences: text("notification_preferences").default('{"email":true,"push":true,"sms":false}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Wallets table
export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pendingBalance: numeric("pending_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalEarned: numeric("total_earned", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalWithdrawn: numeric("total_withdrawn", { precision: 12, scale: 2 }).default("0.00").notNull(),
  currency: text("currency").default("PKR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // Data Entry, App Testing, Survey, Content Review, Proofreading
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  totalSlots: integer("total_slots").notNull().default(100),
  remainingSlots: integer("remaining_slots").notNull().default(100),
  difficulty: text("difficulty").default("Beginner").notNull(),
  requiredProofType: text("required_proof_type").default("text_and_url").notNull(),
  status: text("status").default("active").notNull(), // active, paused, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Task Submissions table
export const taskSubmissions = pgTable("task_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: taskStatusEnum("status").default("submitted").notNull(),
  proofSubmission: text("proof_submission").notNull(), // user proof text / link / notes
  feedback: text("feedback"),
  rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// 6. Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionNumber: text("transaction_number").notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // json string for additional reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  withdrawalNumber: text("withdrawal_number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  accountTitle: text("account_title").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name"),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// 8. Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(), // info, success, warning, system
  isRead: boolean("is_read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Support Tickets table
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketNumber: text("ticket_number").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(), // Account, Tasks, Withdrawal, Technical, Billing
  priority: text("priority").default("Medium").notNull(), // Low, Medium, High
  status: text("status").default("open").notNull(), // open, answered, in_progress, closed
  message: text("message").notNull(),
  replies: text("replies").default("[]"), // JSON string array of { sender, message, timestamp }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. Activation Payments table (1500 PKR Gate)
export const activationPayments = pgTable("activation_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).default("1500.00").notNull(),
  paymentMethod: text("payment_method").notNull(),
  senderName: text("sender_name").notNull(),
  senderNumber: text("sender_number").notNull(),
  trxId: text("trx_id").notNull(),
  receiptUrl: text("receipt_url").default(""),
  notes: text("notes").default(""),
  status: text("status").default("pending").notNull(),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

