package handler

import (
	"context"
	"time"

	"github.com/cscd2/api/internal/database"
	"github.com/cscd2/api/internal/model"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	db *database.DB
}

func New(db *database.DB) *Handler {
	return &Handler{db: db}
}

// =============================================
// Repositories
// =============================================

func (h *Handler) ListRepositories(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.db.Pool.Query(ctx,
		`SELECT id, name, github_url, owner, repo, created_at, updated_at
		 FROM repositories ORDER BY created_at DESC`)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	repos := []model.Repository{}
	for rows.Next() {
		var r model.Repository
		if err := rows.Scan(&r.ID, &r.Name, &r.GithubURL, &r.Owner, &r.Repo, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		repos = append(repos, r)
	}

	return c.JSON(repos)
}

func (h *Handler) CreateRepository(c *fiber.Ctx) error {
	var req model.CreateRepositoryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if req.Name == "" || req.GithubURL == "" || req.Owner == "" || req.Repo == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name, github_url, owner, and repo are required")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var repo model.Repository
	err := h.db.Pool.QueryRow(ctx,
		`INSERT INTO repositories (name, github_url, owner, repo)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, github_url, owner, repo, created_at, updated_at`,
		req.Name, req.GithubURL, req.Owner, req.Repo,
	).Scan(&repo.ID, &repo.Name, &repo.GithubURL, &repo.Owner, &repo.Repo, &repo.CreatedAt, &repo.UpdatedAt)

	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(repo)
}

func (h *Handler) GetRepository(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid repository id")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var repo model.Repository
	err = h.db.Pool.QueryRow(ctx,
		`SELECT id, name, github_url, owner, repo, created_at, updated_at
		 FROM repositories WHERE id = $1`, id,
	).Scan(&repo.ID, &repo.Name, &repo.GithubURL, &repo.Owner, &repo.Repo, &repo.CreatedAt, &repo.UpdatedAt)

	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "repository not found")
	}

	return c.JSON(repo)
}

func (h *Handler) DeleteRepository(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid repository id")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	result, err := h.db.Pool.Exec(ctx, `DELETE FROM repositories WHERE id = $1`, id)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if result.RowsAffected() == 0 {
		return fiber.NewError(fiber.StatusNotFound, "repository not found")
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// =============================================
// Analysis Jobs
// =============================================

func (h *Handler) CreateJob(c *fiber.Ctx) error {
	var req model.CreateJobRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	repoID, err := uuid.Parse(req.RepositoryID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid repository_id")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var job model.AnalysisJob
	err = h.db.Pool.QueryRow(ctx,
		`INSERT INTO analysis_jobs (repository_id, branch_name, pull_request_number, status)
		 VALUES ($1, $2, $3, 'pending')
		 RETURNING id, repository_id, branch_name, pull_request_number, status, error_message, started_at, completed_at, created_at`,
		repoID, req.BranchName, req.PullRequestNumber,
	).Scan(
		&job.ID, &job.RepositoryID, &job.BranchName, &job.PullRequestNumber,
		&job.Status, &job.ErrorMessage, &job.StartedAt, &job.CompletedAt, &job.CreatedAt,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(job)
}

func (h *Handler) ListJobs(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	repoID := c.Query("repository_id")
	query := `SELECT id, repository_id, branch_name, pull_request_number, status,
	           error_message, started_at, completed_at, created_at
	           FROM analysis_jobs`
	args := []interface{}{}

	if repoID != "" {
		query += " WHERE repository_id = $1"
		args = append(args, repoID)
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := h.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	jobs := []model.AnalysisJob{}
	for rows.Next() {
		var j model.AnalysisJob
		if err := rows.Scan(
			&j.ID, &j.RepositoryID, &j.BranchName, &j.PullRequestNumber,
			&j.Status, &j.ErrorMessage, &j.StartedAt, &j.CompletedAt, &j.CreatedAt,
		); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		jobs = append(jobs, j)
	}

	return c.JSON(jobs)
}

func (h *Handler) GetJob(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid job id")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var job model.AnalysisJob
	err = h.db.Pool.QueryRow(ctx,
		`SELECT id, repository_id, branch_name, pull_request_number, status,
		 error_message, started_at, completed_at, created_at
		 FROM analysis_jobs WHERE id = $1`, id,
	).Scan(
		&job.ID, &job.RepositoryID, &job.BranchName, &job.PullRequestNumber,
		&job.Status, &job.ErrorMessage, &job.StartedAt, &job.CompletedAt, &job.CreatedAt,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "job not found")
	}

	return c.JSON(job)
}

func (h *Handler) GetJobResults(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid job id")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.db.Pool.Query(ctx,
		`SELECT id, analysis_job_id, category, new_file_path, existing_file_path,
		 similarity_score, severity, code_snippet, existing_snippet, language, created_at
		 FROM analysis_results WHERE analysis_job_id = $1
		 ORDER BY similarity_score DESC`, id,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	results := []model.AnalysisResult{}
	for rows.Next() {
		var r model.AnalysisResult
		if err := rows.Scan(
			&r.ID, &r.AnalysisJobID, &r.Category, &r.NewFilePath, &r.ExistingFilePath,
			&r.SimilarityScore, &r.Severity, &r.CodeSnippet, &r.ExistingSnippet,
			&r.Language, &r.CreatedAt,
		); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		results = append(results, r)
	}

	return c.JSON(results)
}

// =============================================
// Trigger Analysis (called by GitHub Action)
// =============================================

func (h *Handler) TriggerAnalysis(c *fiber.Ctx) error {
	var req model.TriggerAnalysisRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if req.RepositoryURL == "" || req.BranchName == "" {
		return fiber.NewError(fiber.StatusBadRequest, "repository_url and branch_name are required")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Find or create repository
	var repoID uuid.UUID
	err := h.db.Pool.QueryRow(ctx,
		`SELECT id FROM repositories WHERE github_url = $1`, req.RepositoryURL,
	).Scan(&repoID)

	if err != nil {
		// Auto-register repository
		err = h.db.Pool.QueryRow(ctx,
			`INSERT INTO repositories (name, github_url, owner, repo)
			 VALUES ($1, $2, $3, $4) RETURNING id`,
			req.RepositoryURL, req.RepositoryURL, "auto", "auto",
		).Scan(&repoID)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "failed to register repository")
		}
	}

	// Create analysis job
	var job model.AnalysisJob
	err = h.db.Pool.QueryRow(ctx,
		`INSERT INTO analysis_jobs (repository_id, branch_name, pull_request_number, status)
		 VALUES ($1, $2, $3, 'pending')
		 RETURNING id, repository_id, branch_name, pull_request_number, status, error_message, started_at, completed_at, created_at`,
		repoID, req.BranchName, req.PullRequestNumber,
	).Scan(
		&job.ID, &job.RepositoryID, &job.BranchName, &job.PullRequestNumber,
		&job.Status, &job.ErrorMessage, &job.StartedAt, &job.CompletedAt, &job.CreatedAt,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"job_id":  job.ID,
		"status":  job.Status,
		"message": "Analysis job created successfully",
	})
}
