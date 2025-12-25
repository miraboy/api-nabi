const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");
const isAuthor = require("../middlewares/author.middleware");
const {
  createTontine,
  getAllTontines,
  getTontineById,
  joinTontine,
  makePayment,
  getUserTontines,
  updateTontine,
  deleteTontine,
  getTontineMembers,
  leaveTontine,
} = require("../controllers/tontine.controller");
const {
  createTontineValidation,
  tontineIdValidation,
  makePaymentValidation,
  updateTontineValidation,
} = require("../validators/auth.validators");
const {
  handleValidationErrors,
} = require("../middlewares/validator.middleware");

// All tontine routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/tontines/my:
 *   get:
 *     summary: Get user's tontines (owned and member)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's tontines
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTontinesResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/my", getUserTontines);

/**
 * @swagger
 * /api/tontines:
 *   post:
 *     summary: Create a new tontine
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTontineRequest'
 *     responses:
 *       201:
 *         description: Tontine created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  createTontineValidation,
  handleValidationErrors,
  createTontine
);

/**
 * @swagger
 * /api/tontines:
 *   get:
 *     summary: Get all tontines
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of tontines
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", getAllTontines);

/**
 * @swagger
 * /api/tontines/{id}:
 *   get:
 *     summary: Get tontine details
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       200:
 *         description: Tontine details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", tontineIdValidation, handleValidationErrors, getTontineById);

/**
 * @swagger
 * /api/tontines/{id}/join:
 *   post:
 *     summary: Join a tontine
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       201:
 *         description: Successfully joined tontine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Tontine is full or closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Already a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/join",
  tontineIdValidation,
  handleValidationErrors,
  joinTontine
);

/**
 * @swagger
 * /api/tontines/{id}/pay:
 *   post:
 *     summary: Make a payment (simulation)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       201:
 *         description: Payment successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/pay",
  makePaymentValidation,
  handleValidationErrors,
  makePayment
);

/**
 * @swagger
 * /api/tontines/{id}:
 *   put:
 *     summary: Update a tontine (owner only)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               min_members:
 *                 type: integer
 *               frequency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tontine updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/:id",
  updateTontineValidation,
  handleValidationErrors,
  isAuthor,
  updateTontine
);

/**
 * @swagger
 * /api/tontines/{id}:
 *   delete:
 *     summary: Delete a tontine (owner only)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       200:
 *         description: Tontine deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  tontineIdValidation,
  handleValidationErrors,
  isAuthor,
  deleteTontine
);

/**
 * @swagger
 * /api/tontines/{id}/members:
 *   get:
 *     summary: Get members of a tontine (owner only)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       200:
 *         description: List of tontine members
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
 *                   example: Members retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     tontine_id:
 *                       type: integer
 *                     members_count:
 *                       type: integer
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           tontine_id:
 *                             type: integer
 *                           user_id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           joined_at:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /api/tontines/{id}/leave:
 *   post:
 *     summary: Leave a tontine (member only, after all rounds completed)
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       200:
 *         description: Successfully left tontine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot leave tontine (active cycles or incomplete rounds)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not a member or owner trying to leave
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tontine not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/leave",
  tontineIdValidation,
  handleValidationErrors,
  leaveTontine
);

module.exports = router;
