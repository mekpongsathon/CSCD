package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/cscd2/analyzer/internal/analyzer"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	var (
		repoPath   = flag.String("repo", ".", "Path to repository")
		baseBranch = flag.String("base", "main", "Base branch to compare against")
		jobID      = flag.String("job-id", "", "Analysis job ID")
		outputFile = flag.String("output", "analysis_report.json", "Output JSON report file")
	)
	flag.Parse()

	if *jobID == "" {
		log.Fatal("--job-id is required")
	}

	log.Printf("Starting analysis for job %s on repo %s (base: %s)", *jobID, *repoPath, *baseBranch)

	a := analyzer.New(analyzer.Config{
		RepoPath:   *repoPath,
		BaseBranch: *baseBranch,
		JobID:      *jobID,
	})

	report, err := a.Run()
	if err != nil {
		log.Fatalf("Analysis failed: %v", err)
	}

	if err := report.WriteJSON(*outputFile); err != nil {
		log.Fatalf("Failed to write report: %v", err)
	}

	fmt.Printf("Analysis complete. Found %d findings. Report: %s\n",
		len(report.Findings), *outputFile)

	if len(report.Findings) > 0 {
		os.Exit(1) // Exit with 1 to signal findings exist (used by GitHub Action)
	}
}
