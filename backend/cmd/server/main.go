package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/yanagi93/cloud-collection/backend/config"
	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/handler"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	"github.com/yanagi93/cloud-collection/backend/internal/db"
	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.OpenPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	queries := dbgen.New(pool)
	users := repository.NewUserRepository(queries)
	cloudPhotos := repository.NewCloudPhotoRepository(pool, queries)
	processingJobs := repository.NewProcessingJobRepository(queries)
	animals := repository.NewAnimalRepository(queries)
	auth := service.NewAuthService(users, cfg.JWTSecret, cfg.JWTExpiresIn)
	cloudPhotoService := service.NewCloudPhotoService(cloudPhotos, cfg.UploadsDir)
	processor := service.NewNanoBananaProcessor(cfg.NanoBananaAPIKey, cfg.NanoBananaModel, cfg.NanoBananaEndpoint)
	processingService := service.NewProcessingService(cloudPhotoService, processingJobs, processor, cfg.UploadsDir)
	animalService := service.NewAnimalService(animals, cloudPhotoService)

	apiServer, err := gen.NewServer(
		handler.New(auth, cloudPhotoService, processingService, animalService),
		middleware.NewSecurityHandler(auth),
		gen.WithErrorHandler(handler.ErrorHandler),
	)
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.UploadsDir))))
	mux.Handle("/", apiServer)

	server := &http.Server{
		Addr:    cfg.HTTPAddr,
		Handler: middleware.CORS(cfg.CORSAllowedOrigins, mux),
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("listening on %s", cfg.HTTPAddr)
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		return server.Shutdown(shutdownCtx)
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
