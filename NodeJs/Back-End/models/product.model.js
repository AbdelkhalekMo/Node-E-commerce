import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(v) {
          return v === Math.round(v * 100) / 100; // Ensures max 2 decimal places
        },
        message: 'Price can only have up to 2 decimal places'
      }
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      validate: {
        validator: function(v) {
          return v.startsWith('http://') || v.startsWith('https://');
        },
        message: 'Image must be a valid URL'
      }
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      enum: {
        values: ['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'],
        message: '{VALUE} is not a supported category'
      }
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true // Add index for faster featured product queries
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      review: String
    }],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isFeatured: 1 });
productSchema.index({ price: 1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Update average rating when ratings are modified
productSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.rating, 0) / this.ratings.length;
  }
  next();
});

// Add pagination plugin
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", productSchema);

export default Product;
