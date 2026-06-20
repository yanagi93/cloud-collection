package handler

import (
	"context"
	"errors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func (h *Handler) StartProcessing(ctx context.Context, params gen.StartProcessingParams) (gen.StartProcessingRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return startProcessingUnauthorized(), nil
	}

	job, err := h.processing.Start(ctx, userID, params.PhotoId)
	if errors.Is(err, service.ErrCloudPhotoNotFound) {
		return startProcessingNotFound(), nil
	}
	if errors.Is(err, service.ErrProcessingJobConflict) {
		return &gen.StartProcessingConflict{
			Code:    "PROCESSING_ALREADY_STARTED",
			Message: "既に処理中または完了済みです",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return processingJobResponse(job), nil
}

func (h *Handler) GetProcessingResult(ctx context.Context, params gen.GetProcessingResultParams) (gen.GetProcessingResultRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return getProcessingResultUnauthorized(), nil
	}

	job, err := h.processing.GetLatest(ctx, userID, params.PhotoId)
	if errors.Is(err, service.ErrCloudPhotoNotFound) || errors.Is(err, service.ErrProcessingJobNotFound) {
		return getProcessingResultNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	return processingJobResponse(job), nil
}

func processingJobResponse(job dbgen.ProcessingJob) *gen.ProcessingJob {
	res := &gen.ProcessingJob{
		ID:          job.ID,
		PhotoID:     job.PhotoID,
		Status:      gen.ProcessingStatus(job.Status),
		StartedAt:   apiNilDateTime(job.StartedAt),
		CompletedAt: apiNilDateTime(job.CompletedAt),
		CreatedAt:   job.CreatedAt.Time,
	}
	if job.SuggestedAnimal.Valid && job.Confidence.Valid && job.DoodleImageUrl.Valid && job.CompositeImageUrl.Valid {
		res.Result.SetTo(gen.ProcessingResult{
			SuggestedAnimal:   job.SuggestedAnimal.String,
			Confidence:        float32(job.Confidence.Float64),
			Description:       apiString(job.Description),
			DoodleImageURL:    urlValue(job.DoodleImageUrl.String),
			CompositeImageURL: urlValue(job.CompositeImageUrl.String),
		})
	}
	if job.ErrorCode.Valid || job.ErrorMessage.Valid {
		res.Error.SetTo(gen.ProcessingJobError{
			Code:    apiString(job.ErrorCode),
			Message: apiString(job.ErrorMessage),
		})
	}
	return res
}

func startProcessingUnauthorized() *gen.StartProcessingUnauthorized {
	return &gen.StartProcessingUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func getProcessingResultUnauthorized() *gen.GetProcessingResultUnauthorized {
	return &gen.GetProcessingResultUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func startProcessingNotFound() *gen.StartProcessingNotFound {
	return &gen.StartProcessingNotFound{
		Code:    "CLOUD_PHOTO_NOT_FOUND",
		Message: "雲の写真が見つかりません",
	}
}

func getProcessingResultNotFound() *gen.GetProcessingResultNotFound {
	return &gen.GetProcessingResultNotFound{
		Code:    "PROCESSING_JOB_NOT_FOUND",
		Message: "処理ジョブが見つかりません",
	}
}
