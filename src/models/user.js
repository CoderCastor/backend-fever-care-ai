const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["patient", "clinician", "admin"],
      required: true,
      default: "patient",
    },
    
    // Optional phone (for patients mainly)
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    lastLogin: Date,
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ phone: 1 });

// Virtual for profile reference
userSchema.virtual('profile', {
  ref: function() {
    return this.role === 'patient' ? 'PatientProfile' : 'ClinicianProfile';
  },
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("User", userSchema);
