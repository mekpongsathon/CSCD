package main

import (
	"log"
	"os"

	"github.com/cscd2/api/internal/database"
	"github.com/cscd2/api/internal/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	db, err := database.Connect(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	app := fiber.New(fiber.Config{
		AppName: "CSCD2 API v1.0",
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("CORS_ORIGINS"),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	h := handler.New(db)

	api := app.Group("/api/v1")

	// Health
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Repositories
	api.Get("/repositories", h.ListRepositories)
	api.Post("/repositories", h.CreateRepository)
	api.Get("/repositories/:id", h.GetRepository)
	api.Delete("/repositories/:id", h.DeleteRepository)

	// Analysis Jobs
	api.Post("/jobs", h.CreateJob)
	api.Get("/jobs", h.ListJobs)
	api.Get("/jobs/:id", h.GetJob)

	// Analysis Results
	api.Get("/jobs/:id/results", h.GetJobResults)

	// Trigger analysis from GitHub Action
	api.Post("/analyze", h.TriggerAnalysis)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on :%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
