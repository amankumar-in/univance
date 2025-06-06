const express = require("express");
const router = express.Router();
const taskCategoryController = require("../controllers/taskCategory.controller");
const authMiddleware = require("../middleware/auth.middleware");

/**
 * @openapi
 * components:
 *   schemas:
 *     TaskCategory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the category
 *         name:
 *           type: string
 *           description: Name of the category
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *         icon:
 *           type: string
 *           description: Icon or emoji for the category
 *         color:
 *           type: string
 *           description: Color for UI representation
 *         parentCategory:
 *           type: string
 *           description: ID of parent category if this is a subcategory
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the category
 *         creatorRole:
 *           type: string
 *           enum: [parent, teacher, school_admin, social_worker, platform_admin, system]
 *           description: Role of the creator
 *         type:
 *           type: string
 *           enum: [academic, home, behavior, extracurricular, attendance, system, custom]
 *           description: Type of category
 *         defaultPointValue:
 *           type: number
 *           description: Default point value for tasks in this category
 *         schoolId:
 *           type: string
 *           description: ID of the school (for school-specific categories)
 *         subject:
 *           type: string
 *           description: Subject (for academic categories)
 *         gradeLevel:
 *           type: number
 *           description: Grade level (for grade-specific categories)
 *         isSystem:
 *           type: boolean
 *           description: Whether this is a system category that cannot be modified
 *         visibility:
 *           type: string
 *           enum: [private, family, class, school, public]
 *           description: Who can see and use this category
 *         displayOrder:
 *           type: number
 *           description: Ordering for display
 *         isActive:
 *           type: boolean
 *           description: Whether this category is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     TaskCategoryCreate:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           example: "Math Homework"
 *         description:
 *           type: string
 *           example: "Math assignments and practice problems"
 *         icon:
 *           type: string
 *           example: "calculator"
 *         color:
 *           type: string
 *           example: "#4285F4"
 *         parentCategory:
 *           type: string
 *           example: "60f8a9b5e6b3f32f8c9a8d7e"
 *         type:
 *           type: string
 *           enum: [academic, home, behavior, extracurricular, attendance, system, custom]
 *           example: "academic"
 *         defaultPointValue:
 *           type: number
 *           example: 15
 *         schoolId:
 *           type: string
 *           example: "60f8a9b5e6b3f32f8c9a8d7e"
 *         subject:
 *           type: string
 *           example: "Mathematics"
 *         gradeLevel:
 *           type: number
 *           example: 8
 *         visibility:
 *           type: string
 *           enum: [private, family, class, school, public]
 *           example: "school"
 *         displayOrder:
 *           type: number
 *           example: 10
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

/**
 * @openapi
 * /tasks/categories:
 *   get:
 *     summary: Get task categories with filtering
 *     description: Retrieves task categories based on various filter criteria
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Category type
 *         schema:
 *           type: string
 *           enum: [academic, home, behavior, extracurricular, attendance, system, custom]
 *       - name: createdBy
 *         in: query
 *         description: ID of user who created categories
 *         schema:
 *           type: string
 *       - name: visibility
 *         in: query
 *         description: Category visibility
 *         schema:
 *           type: string
 *           enum: [private, family, class, school, public]
 *       - name: schoolId
 *         in: query
 *         description: Filter by school ID
 *         schema:
 *           type: string
 *       - name: isSystem
 *         in: query
 *         description: Filter system categories
 *         schema:
 *           type: boolean
 *       - name: subject
 *         in: query
 *         description: Filter by subject
 *         schema:
 *           type: string
 *       - name: gradeLevel
 *         in: query
 *         description: Filter by grade level
 *         schema:
 *           type: number
 *       - name: search
 *         in: query
 *         description: Search by name
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskCategory'
 *       '500':
 *         description: Failed to get categories
 */
router.get("/", taskCategoryController.getCategories);


/**
 * @openapi
 * /tasks/categories:
 *   post:
 *     summary: Create a new task category
 *     description: Creates a new category for organizing tasks
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Category details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCategoryCreate'
 *     responses:
 *       '201':
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TaskCategory'
 *       '400':
 *         description: Missing required fields or category with same name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: name and type are required"
 *       '500':
 *         description: Failed to create category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create category"
 *                 error:
 *                   type: string
 */
router.post("/", taskCategoryController.createCategory);

/**
 * @openapi
 * /tasks/categories/{id}:
 *   get:
 *     summary: Get a specific task category by ID
 *     description: Retrieves detailed information about a task category by its ID
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the category to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TaskCategory'
 *       '400':
 *         description: Invalid category ID format
 *       '403':
 *         description: Not authorized to view this category
 *       '404':
 *         description: Category not found
 *       '500':
 *         description: Failed to get category
 */
router.get("/:id", taskCategoryController.getCategoryById);

/**
 * @openapi
 * /tasks/categories/{id}:
 *   put:
 *     summary: Update a task category
 *     description: Updates a task category with the provided details
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the category to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated category details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *               defaultPointValue:
 *                 type: number
 *               subject:
 *                 type: string
 *               gradeLevel:
 *                 type: number
 *               visibility:
 *                 type: string
 *               displayOrder:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TaskCategory'
 *       '400':
 *         description: Invalid category ID format
 *       '403':
 *         description: Not authorized to update this category or system categories cannot be modified
 *       '404':
 *         description: Category not found
 *       '500':
 *         description: Failed to update category
 */
router.put("/:id", taskCategoryController.updateCategory);

/**
 * @openapi
 * /tasks/categories/{id}:
 *   delete:
 *     summary: Delete a task category (soft delete)
 *     description: Marks a task category as deleted (soft delete)
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the category to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *       '400':
 *         description: Invalid category ID format
 *       '403':
 *         description: Not authorized to delete this category or system categories cannot be deleted
 *       '404':
 *         description: Category not found
 *       '500':
 *         description: Failed to delete category
 */
router.delete("/:id", taskCategoryController.deleteCategory);

/**
 * @openapi
 * /tasks/categories/defaults:
 *   post:
 *     summary: Create default system categories
 *     description: Initializes the system with default task categories
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Default categories initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Default categories initialized: 10 created, 0 already existed"
 *       '403':
 *         description: Only platform administrators can create system categories
 *       '500':
 *         description: Failed to create default categories
 */
router.post("/defaults", taskCategoryController.createDefaultCategories);

/**
 * @openapi
 * /tasks/categories/context/{context}:
 *   get:
 *     summary: Get categories for a specific user context
 *     description: Retrieves categories relevant to a specific context (e.g., academic, home)
 *     tags:
 *       - Task Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: context
 *         in: path
 *         description: Context to retrieve categories for
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academic, home, behavior, extracurricular, attendance, all]
 *     responses:
 *       '200':
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           parent:
 *                             type: object
 *                             nullable: true
 *                           subcategories:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/TaskCategory'
 *                     context:
 *                       type: string
 *                       example: "academic"
 *       '400':
 *         description: Invalid context
 *       '500':
 *         description: Failed to get categories
 */
router.get(
  "/context/:context",
  taskCategoryController.getUserContextCategories
);

module.exports = router;
