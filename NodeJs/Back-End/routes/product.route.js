import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
  updateProduct,
  getProductById,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { body, param, query, validationResult } from "express-validator";

const router = express.Router();

// Validation middleware
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .isIn(['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['price', '-price', 'createdAt', '-createdAt', 'name', '-name'])
    .withMessage('Invalid sort parameter')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

const validateCategory = [
  param('category')
    .trim()
    .isIn(['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'])
    .withMessage('Invalid category')
];

// Validation result middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes with validation and error handling
router.get("/", 
  validatePagination,
  handleValidationErrors,
  catchAsync(getAllProducts)
);

router.get("/featured", 
  validatePagination,
  handleValidationErrors,
  catchAsync(getFeaturedProducts)
);

router.get("/category/:category",
  validateCategory,
  validatePagination,
  handleValidationErrors,
  catchAsync(getProductsByCategory)
);

router.get("/recommendations",
  query('excludeId').optional().isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors,
  catchAsync(getRecommendedProducts)
);

router.get("/:id",
  validateId,
  handleValidationErrors,
  catchAsync(getProductById)
);

router.post("/",
  protectRoute,
  adminRoute,
  validateProduct,
  handleValidationErrors,
  catchAsync(createProduct)
);

router.put("/:id",
  protectRoute,
  adminRoute,
  validateId,
  validateProduct,
  handleValidationErrors,
  catchAsync(updateProduct)
);

router.patch("/:id",
  protectRoute,
  adminRoute,
  validateId,
  handleValidationErrors,
  catchAsync(toggleFeaturedProduct)
);

router.delete("/:id",
  protectRoute,
  adminRoute,
  validateId,
  handleValidationErrors,
  catchAsync(deleteProduct)
);

export default router;
