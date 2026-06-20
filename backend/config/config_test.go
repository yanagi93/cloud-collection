package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoadReadsDotEnv(t *testing.T) {
	restore := preserveEnv(t, "DATABASE_URL", "JWT_SECRET", "PORT", "HTTP_ADDR", "JWT_EXPIRES_IN_SECONDS", "SHUTDOWN_TIMEOUT_SECONDS")
	defer restore()

	dir := t.TempDir()
	chdir(t, dir)

	writeDotEnv(t, dir, `
DATABASE_URL=postgres://dotenv
JWT_SECRET=dotenv-secret
PORT=9090
JWT_EXPIRES_IN_SECONDS=7200
SHUTDOWN_TIMEOUT_SECONDS=15
`)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.DatabaseURL != "postgres://dotenv" {
		t.Fatalf("DatabaseURL = %q", cfg.DatabaseURL)
	}
	if cfg.JWTSecret != "dotenv-secret" {
		t.Fatalf("JWTSecret = %q", cfg.JWTSecret)
	}
	if cfg.HTTPAddr != ":9090" {
		t.Fatalf("HTTPAddr = %q", cfg.HTTPAddr)
	}
	if cfg.JWTExpiresIn != 2*time.Hour {
		t.Fatalf("JWTExpiresIn = %s", cfg.JWTExpiresIn)
	}
	if cfg.ShutdownTimeout != 15*time.Second {
		t.Fatalf("ShutdownTimeout = %s", cfg.ShutdownTimeout)
	}
}

func TestLoadPrefersEnvironmentOverDotEnv(t *testing.T) {
	restore := preserveEnv(t, "DATABASE_URL", "JWT_SECRET", "PORT", "HTTP_ADDR", "JWT_EXPIRES_IN_SECONDS", "SHUTDOWN_TIMEOUT_SECONDS")
	defer restore()

	dir := t.TempDir()
	chdir(t, dir)

	writeDotEnv(t, dir, `
DATABASE_URL=postgres://dotenv
JWT_SECRET=dotenv-secret
PORT=9090
JWT_EXPIRES_IN_SECONDS=7200
SHUTDOWN_TIMEOUT_SECONDS=15
`)
	setenv(t, "DATABASE_URL", "postgres://env")
	setenv(t, "JWT_SECRET", "env-secret")
	setenv(t, "HTTP_ADDR", ":7070")
	setenv(t, "JWT_EXPIRES_IN_SECONDS", "1800")
	setenv(t, "SHUTDOWN_TIMEOUT_SECONDS", "5")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.DatabaseURL != "postgres://env" {
		t.Fatalf("DatabaseURL = %q", cfg.DatabaseURL)
	}
	if cfg.JWTSecret != "env-secret" {
		t.Fatalf("JWTSecret = %q", cfg.JWTSecret)
	}
	if cfg.HTTPAddr != ":7070" {
		t.Fatalf("HTTPAddr = %q", cfg.HTTPAddr)
	}
	if cfg.JWTExpiresIn != 30*time.Minute {
		t.Fatalf("JWTExpiresIn = %s", cfg.JWTExpiresIn)
	}
	if cfg.ShutdownTimeout != 5*time.Second {
		t.Fatalf("ShutdownTimeout = %s", cfg.ShutdownTimeout)
	}
}

func chdir(t *testing.T, dir string) {
	t.Helper()

	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(wd); err != nil {
			t.Fatal(err)
		}
	})
}

func writeDotEnv(t *testing.T, dir, body string) {
	t.Helper()

	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
}

func setenv(t *testing.T, key, value string) {
	t.Helper()

	if err := os.Setenv(key, value); err != nil {
		t.Fatal(err)
	}
}

func preserveEnv(t *testing.T, keys ...string) func() {
	t.Helper()

	original := make(map[string]string, len(keys))
	present := make(map[string]bool, len(keys))
	for _, key := range keys {
		value, ok := os.LookupEnv(key)
		if ok {
			original[key] = value
			present[key] = true
		}
		if err := os.Unsetenv(key); err != nil {
			t.Fatal(err)
		}
	}

	return func() {
		for _, key := range keys {
			var err error
			if present[key] {
				err = os.Setenv(key, original[key])
			} else {
				err = os.Unsetenv(key)
			}
			if err != nil {
				t.Fatal(err)
			}
		}
	}
}
