package analyzer

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// Config holds the analyzer configuration
type Config struct {
	RepoPath   string
	BaseBranch string
	JobID      string
	MinLines   int
	MinTokens  int
}

// Severity levels
const (
	SeverityInfo     = "info"
	SeverityWarning  = "warning"
	SeverityCritical = "critical"
)

// Thresholds for severity
const (
	ThresholdInfo     = 60.0
	ThresholdWarning  = 75.0
	ThresholdCritical = 90.0
)

// Ignore patterns
var ignorePatterns = []string{
	"dist/", "build/", "generated/", "node_modules/",
	"migrations/", ".g.ts", "vendor/",
}

// Frontend file extensions
var frontendExts = map[string]bool{
	".ts": true, ".tsx": true, ".js": true, ".jsx": true,
	".css": true, ".scss": true,
}

// Backend file extensions
var backendExts = map[string]bool{
	".go": true, ".cs": true, ".java": true, ".py": true,
}

// Finding represents a single duplicate code finding
type Finding struct {
	NewFilePath      string  `json:"new_file_path"`
	ExistingFilePath string  `json:"existing_file_path"`
	SimilarityScore  float64 `json:"similarity_score"`
	Severity         string  `json:"severity"`
	Category         string  `json:"category"`
	Language         string  `json:"language"`
	CodeSnippet      string  `json:"code_snippet"`
	ExistingSnippet  string  `json:"existing_snippet"`
}

// Report is the final analysis output
type Report struct {
	JobID         string    `json:"job_id"`
	RepoPath      string    `json:"repo_path"`
	BaseBranch    string    `json:"base_branch"`
	AnalyzedAt    time.Time `json:"analyzed_at"`
	Findings      []Finding `json:"findings"`
	TotalFiles    int       `json:"total_files"`
	FrontendCount int       `json:"frontend_count"`
	BackendCount  int       `json:"backend_count"`
}

func (r *Report) WriteJSON(path string) error {
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

// Analyzer orchestrates the analysis
type Analyzer struct {
	cfg Config
}

func New(cfg Config) *Analyzer {
	if cfg.MinLines == 0 {
		cfg.MinLines = 8
	}
	if cfg.MinTokens == 0 {
		cfg.MinTokens = 20
	}
	return &Analyzer{cfg: cfg}
}

// Run performs the full analysis pipeline
func (a *Analyzer) Run() (*Report, error) {
	report := &Report{
		JobID:      a.cfg.JobID,
		RepoPath:   a.cfg.RepoPath,
		BaseBranch: a.cfg.BaseBranch,
		AnalyzedAt: time.Now(),
		Findings:   []Finding{},
	}

	// Step 1: Get changed files
	changedFiles, err := a.getChangedFiles()
	if err != nil {
		return nil, fmt.Errorf("failed to get changed files: %w", err)
	}

	report.TotalFiles = len(changedFiles)

	// Step 2: Separate frontend and backend
	frontendFiles := []string{}
	backendFiles := []string{}
	for _, f := range changedFiles {
		if isIgnored(f) {
			continue
		}
		ext := strings.ToLower(filepath.Ext(f))
		if frontendExts[ext] {
			frontendFiles = append(frontendFiles, f)
		} else if backendExts[ext] {
			backendFiles = append(backendFiles, f)
		}
	}

	report.FrontendCount = len(frontendFiles)
	report.BackendCount = len(backendFiles)

	// Step 3+: Analyze frontend files
	for _, newFile := range frontendFiles {
		findings, err := a.analyzeFile(newFile, "frontend")
		if err != nil {
			continue
		}
		report.Findings = append(report.Findings, findings...)
	}

	// Step 3+: Analyze backend files
	for _, newFile := range backendFiles {
		findings, err := a.analyzeFile(newFile, "backend")
		if err != nil {
			continue
		}
		report.Findings = append(report.Findings, findings...)
	}

	return report, nil
}

// getChangedFiles uses git diff to find added/modified files
func (a *Analyzer) getChangedFiles() ([]string, error) {
	cmd := exec.Command("git", "diff", "--name-only",
		"--diff-filter=AM",
		fmt.Sprintf("origin/%s...HEAD", a.cfg.BaseBranch))
	cmd.Dir = a.cfg.RepoPath

	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git diff failed: %w", err)
	}

	files := []string{}
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line != "" {
			files = append(files, line)
		}
	}
	return files, nil
}

// analyzeFile compares a new file against all existing files using fingerprinting
func (a *Analyzer) analyzeFile(newFilePath, category string) ([]Finding, error) {
	fullNewPath := filepath.Join(a.cfg.RepoPath, newFilePath)
	newContent, err := os.ReadFile(fullNewPath)
	if err != nil {
		return nil, err
	}

	newTokens := tokenize(string(newContent))
	if len(newTokens) < a.cfg.MinTokens {
		return nil, nil
	}
	if lineCount(string(newContent)) < a.cfg.MinLines {
		return nil, nil
	}

	newNorm := normalize(string(newContent))
	newFP := fingerprint(newNorm)

	// Walk existing files in repo (same category)
	findings := []Finding{}
	ext := filepath.Ext(newFilePath)

	err = filepath.WalkDir(a.cfg.RepoPath, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}

		rel, _ := filepath.Rel(a.cfg.RepoPath, path)
		if rel == newFilePath || isIgnored(rel) {
			return nil
		}
		if filepath.Ext(path) != ext {
			return nil
		}

		existingContent, err := os.ReadFile(path)
		if err != nil {
			return nil
		}

		if lineCount(string(existingContent)) < a.cfg.MinLines {
			return nil
		}

		existingNorm := normalize(string(existingContent))
		existingFP := fingerprint(existingNorm)

		score := similarityScore(newFP, existingFP, newNorm, existingNorm)
		if score >= ThresholdInfo {
			sev := getSeverity(score)
			lang := extToLanguage(ext)

			newSnippet := firstNLines(string(newContent), 20)
			existSnippet := firstNLines(string(existingContent), 20)

			findings = append(findings, Finding{
				NewFilePath:      newFilePath,
				ExistingFilePath: rel,
				SimilarityScore:  score,
				Severity:         sev,
				Category:         category,
				Language:         lang,
				CodeSnippet:      newSnippet,
				ExistingSnippet:  existSnippet,
			})
		}
		return nil
	})

	return findings, err
}

// =============================================
// Core analysis algorithms
// =============================================

// tokenize splits code into tokens
func tokenize(code string) []string {
	// Simple whitespace + punctuation tokenizer
	tokens := []string{}
	current := strings.Builder{}
	for _, ch := range code {
		if ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r' {
			if current.Len() > 0 {
				tokens = append(tokens, current.String())
				current.Reset()
			}
		} else {
			current.WriteRune(ch)
		}
	}
	if current.Len() > 0 {
		tokens = append(tokens, current.String())
	}
	return tokens
}

// normalize removes comments, formatting, and normalizes identifiers
func normalize(code string) string {
	lines := strings.Split(code, "\n")
	result := []string{}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// Remove single-line comments
		if strings.HasPrefix(trimmed, "//") ||
			strings.HasPrefix(trimmed, "#") ||
			strings.HasPrefix(trimmed, "--") {
			continue
		}
		result = append(result, trimmed)
	}

	return strings.Join(result, "\n")
}

// fingerprint generates a rolling hash fingerprint using Winnowing algorithm
func fingerprint(code string) []uint64 {
	const (
		base   = 31
		mod    = 1_000_000_007
		kGram  = 5
		window = 4
	)

	tokens := tokenize(code)
	if len(tokens) < kGram {
		// Fall back to simple token hashes
		hashes := make([]uint64, len(tokens))
		for i, t := range tokens {
			hashes[i] = hashString(t)
		}
		return hashes
	}

	// Generate k-gram hashes
	kgrams := make([]uint64, 0, len(tokens)-kGram+1)
	for i := 0; i <= len(tokens)-kGram; i++ {
		gram := strings.Join(tokens[i:i+kGram], " ")
		kgrams = append(kgrams, hashString(gram))
	}

	// Winnowing: select minimum hash in each window
	fps := []uint64{}
	_ = base
	_ = mod

	lastMin := uint64(0)
	lastMinPos := -1
	for i := 0; i <= len(kgrams)-window; i++ {
		w := kgrams[i : i+window]
		minVal := w[0]
		minPos := i
		for j, h := range w {
			if h < minVal {
				minVal = h
				minPos = i + j
			}
		}
		if minPos != lastMinPos {
			fps = append(fps, minVal)
			lastMin = minVal
			lastMinPos = minPos
		} else {
			_ = lastMin
		}
	}

	return fps
}

// hashString computes a simple hash for a string
func hashString(s string) uint64 {
	var h uint64 = 14695981039346656037
	for i := 0; i < len(s); i++ {
		h ^= uint64(s[i])
		h *= 1099511628211
	}
	return h
}

// similarityScore computes the Jaccard similarity between two fingerprint sets
func similarityScore(fp1, fp2 []uint64, norm1, norm2 string) float64 {
	if len(fp1) == 0 || len(fp2) == 0 {
		return 0
	}

	set1 := make(map[uint64]bool)
	for _, h := range fp1 {
		set1[h] = true
	}

	intersection := 0
	for _, h := range fp2 {
		if set1[h] {
			intersection++
		}
	}

	union := len(fp1) + len(fp2) - intersection
	if union == 0 {
		return 0
	}

	return float64(intersection) / float64(union) * 100.0
}

func getSeverity(score float64) string {
	if score >= ThresholdCritical {
		return SeverityCritical
	}
	if score >= ThresholdWarning {
		return SeverityWarning
	}
	return SeverityInfo
}

func isIgnored(path string) bool {
	for _, pattern := range ignorePatterns {
		if strings.Contains(path, pattern) {
			return true
		}
	}
	return false
}

func lineCount(code string) int {
	return len(strings.Split(code, "\n"))
}

func firstNLines(code string, n int) string {
	lines := strings.Split(code, "\n")
	if len(lines) <= n {
		return code
	}
	return strings.Join(lines[:n], "\n") + "\n..."
}

func extToLanguage(ext string) string {
	switch ext {
	case ".ts", ".tsx":
		return "typescript"
	case ".js", ".jsx":
		return "javascript"
	case ".go":
		return "go"
	case ".cs":
		return "csharp"
	case ".py":
		return "python"
	case ".java":
		return "java"
	default:
		return "unknown"
	}
}
