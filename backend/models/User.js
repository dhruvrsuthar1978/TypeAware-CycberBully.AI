// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true, // creates a unique index
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_ ]+$/,
        "Username can only contain letters, numbers, underscores, and spaces",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // creates a unique index
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // excluded from queries
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    browserUUIDs: [
      {
        uuid: { type: String, required: true },
        firstSeen: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now },
        userAgent: String,
      },
    ],
    preferences: {
      darkMode: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
    },
    stats: {
      totalReports: { type: Number, default: 0, min: 0 },
      lastActivity: { type: Date, default: Date.now },
      totalViolations: { type: Number, default: 0, min: 0 },
      warningCount: { type: Number, default: 0, min: 0 },
      suspensionCount: { type: Number, default: 0, min: 0 },
    },
    moderation: {
      status: {
        type: String,
        enum: ["active", "warned", "suspended", "banned", "shadow_banned"],
        default: "active",
      },
      shadowBanned: { type: Boolean, default: false },
      suspensionEndDate: { type: Date, default: null },
      banReason: { type: String, default: "" },
      lastWarningDate: { type: Date, default: null },
      lastSuspensionDate: { type: Date, default: null },
      moderationNotes: [{
        date: { type: Date, default: Date.now },
        admin: { type: String, required: true },
        action: { type: String, required: true },
        reason: { type: String, required: true },
        details: { type: String, default: "" }
      }],
      violationHistory: [{
        date: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ["warning", "suspension", "ban", "shadow_ban"],
          required: true
        },
        reason: { type: String, required: true },
        severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
        reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
        adminAction: { type: Boolean, default: false }
      }]
    },
    privacy: {
      anonymousTracking: { type: Boolean, default: true },
      dataRetention: {
        deleteAfterInactive: { type: Number, default: 365 }, // days
        anonymizeAfter: { type: Number, default: 180 } // days
      },
      gdprConsent: { type: Boolean, default: false },
      lastDataExport: { type: Date, default: null }
    },
    refreshToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- INDEXES ---
// Keep only what you need. Avoid duplicate definitions.
userSchema.index({ "browserUUIDs.uuid": 1 });
userSchema.index({ role: 1 });

// --- VIRTUALS ---
userSchema.virtual("fullName").get(function () {
  return this.username;
});

// --- MIDDLEWARE ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// --- INSTANCE METHODS ---
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpiry;
  delete userObject.emailVerificationToken;
  delete userObject.__v;
  return userObject;
};

// --- STATIC METHODS ---
userSchema.statics.findByBrowserUUID = function (uuid) {
  return this.findOne({ "browserUUIDs.uuid": uuid });
};

module.exports = mongoose.model("User", userSchema);
