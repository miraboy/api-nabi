const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Nabi - Tontine REST API",
      version: "1.0.0",
      description:
        "API REST pour la gestion de tontines avec authentification JWT",
      contact: {
        name: "API Support",
        email: "support@api-nabi.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "password123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            message: {
              type: "string",
              example: "User registered successfully",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        CreateTontineRequest: {
          type: "object",
          required: ["name", "amount", "min_members", "frequency"],
          properties: {
            name: {
              type: "string",
              example: "Tontine familiale",
            },
            amount: {
              type: "number",
              example: 10000,
            },
            min_members: {
              type: "integer",
              minimum: 2,
              example: 5,
            },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly", "yearly"],
              example: "monthly",
            },
            pickup_policy: {
              type: "string",
              enum: ["arrival", "random", "custom"],
              default: "arrival",
              example: "arrival",
              description:
                "Order policy for collecting the pot: arrival (first joined), random, or custom",
            },
          },
        },
        PaymentRequest: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: {
              type: "number",
              example: 10000,
            },
          },
        },
        UpdateTontineRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Tontine familiale mise à jour",
            },
            amount: {
              type: "number",
              example: 15000,
            },
            min_members: {
              type: "integer",
              minimum: 2,
              example: 8,
            },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly", "yearly"],
              example: "weekly",
            },
            pickup_policy: {
              type: "string",
              enum: ["arrival", "random", "custom"],
              example: "random",
              description: "Order policy for collecting the pot",
            },
          },
        },
        CreateCycleRequest: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              format: "date",
              example: "2025-01-01",
              description: "Cycle start date (optional)",
            },
            end_date: {
              type: "string",
              format: "date",
              example: "2025-12-31",
              description: "Cycle end date (optional)",
            },
            custom_order: {
              type: "array",
              items: {
                type: "integer",
              },
              example: [1, 3, 7, 2, 5],
              description:
                "Custom order of user IDs (required if pickup_policy is 'custom')",
            },
          },
        },
        Tontine: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Tontine familiale",
            },
            amount: {
              type: "number",
              example: 10000,
            },
            min_members: {
              type: "integer",
              minimum: 2,
              example: 5,
            },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly", "yearly"],
              example: "monthly",
            },
            status: {
              type: "string",
              enum: ["open", "closed"],
              example: "open",
            },
            owner_id: {
              type: "integer",
              example: 1,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UserTontinesResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                owned: {
                  type: "array",
                  description: "Tontines where user is the owner",
                  items: {
                    $ref: "#/components/schemas/Tontine",
                  },
                },
                member: {
                  type: "array",
                  description: "Tontines where user is a member",
                  items: {
                    $ref: "#/components/schemas/Tontine",
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints (protected)",
      },
      {
        name: "Tontines",
        description: "Tontine management endpoints (protected)",
      },
      {
        name: "Cycles",
        description: "Tontine cycles and rounds management (protected)",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
