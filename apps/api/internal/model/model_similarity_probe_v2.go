package model

import (
	"time"

	"github.com/google/uuid"
)

type RepositoryProbeV2 struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	GithubURL string    `json:"github_url"`
	Owner     string    `json:"owner"`
	Repo      string    `json:"repo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AnalysisJobProbeV2 struct {
	ID                uuid.UUID  `json:"id"`
	RepositoryID      uuid.UUID  `json:"repository_id"`
	BranchName        string     `json:"branch_name"`
	PullRequestNumber *int       `json:"pull_request_number,omitempty"`
	Status            string     `json:"status"`
	ErrorMessage      *string    `json:"error_message,omitempty"`
	StartedAt         *time.Time `json:"started_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
}

type AnalysisResultProbeV2 struct {
	ID               uuid.UUID `json:"id"`
	AnalysisJobID    uuid.UUID `json:"analysis_job_id"`
	Category         string    `json:"category"`
	NewFilePath      string    `json:"new_file_path"`
	ExistingFilePath string    `json:"existing_file_path"`
	SimilarityScore  float64   `json:"similarity_score"`
	Severity         string    `json:"severity"`
	CodeSnippet      *string   `json:"code_snippet,omitempty"`
	ExistingSnippet  *string   `json:"existing_snippet,omitempty"`
	Language         string    `json:"language"`
	CreatedAt        time.Time `json:"created_at"`
}
