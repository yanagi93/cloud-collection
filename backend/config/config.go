package config

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	HTTPAddr           string
	DatabaseURL        string
	CORSAllowedOrigins []string
	JWTSecret          string
	JWTExpiresIn       time.Duration
	ShutdownTimeout    time.Duration
	UploadsDir         string
	NanoBananaAPIKey   string
	NanoBananaModel    string
	NanoBananaEndpoint string
}

func Load() (Config, error) {
	dotenv := readDotEnvFiles("../.env", ".env")

	cfg := Config{
		HTTPAddr:           httpAddr(get("HTTP_ADDR", dotenv, ""), get("PORT", dotenv, "8080")),
		DatabaseURL:        get("DATABASE_URL", dotenv, ""),
		CORSAllowedOrigins: list(get("CORS_ALLOWED_ORIGINS", dotenv, "http://localhost:3000")),
		JWTSecret:          get("JWT_SECRET", dotenv, ""),
		JWTExpiresIn:       durationSeconds(get("JWT_EXPIRES_IN_SECONDS", dotenv, "3600")),
		ShutdownTimeout:    durationSeconds(get("SHUTDOWN_TIMEOUT_SECONDS", dotenv, "10")),
		UploadsDir:         get("UPLOADS_DIR", dotenv, "uploads"),
		NanoBananaAPIKey:   get("NANO_BANANA_API_KEY", dotenv, ""),
		NanoBananaModel:    get("NANO_BANANA_MODEL", dotenv, "gemini-3.1-flash-image"),
		NanoBananaEndpoint: get("NANO_BANANA_ENDPOINT", dotenv, "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return Config{}, errors.New("JWT_SECRET is required")
	}
	if cfg.JWTExpiresIn <= 0 {
		return Config{}, errors.New("JWT_EXPIRES_IN_SECONDS must be greater than 0")
	}
	if cfg.ShutdownTimeout <= 0 {
		return Config{}, errors.New("SHUTDOWN_TIMEOUT_SECONDS must be greater than 0")
	}

	return cfg, nil
}

func get(key string, dotenv map[string]string, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	if v, ok := dotenv[key]; ok {
		return v
	}
	return fallback
}

func readDotEnvFiles(paths ...string) map[string]string {
	values := make(map[string]string)
	for _, path := range paths {
		readDotEnv(path, values)
	}
	return values
}

func readDotEnv(path string, values map[string]string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)
		if key != "" {
			values[key] = value
		}
	}
}

func httpAddr(addr, port string) string {
	if addr != "" {
		return addr
	}
	if strings.HasPrefix(port, ":") {
		return port
	}
	return ":" + port
}

func durationSeconds(value string) time.Duration {
	seconds, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return time.Duration(seconds) * time.Second
}

func list(value string) []string {
	parts := strings.Split(value, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			values = append(values, part)
		}
	}
	return values
}

func (c Config) String() string {
	return fmt.Sprintf("http_addr=%s jwt_expires_in=%s shutdown_timeout=%s", c.HTTPAddr, c.JWTExpiresIn, c.ShutdownTimeout)
}
