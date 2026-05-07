package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Duplicate of db.go for testing duplication detection
type DBHelper struct {
	Pool *pgxpool.Pool
}

func ConnectHelper(databaseURL string) (*DBHelper, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is not set")
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DBHelper{Pool: pool}, nil
}

func (db *DBHelper) Close() {
	db.Pool.Close()
}
