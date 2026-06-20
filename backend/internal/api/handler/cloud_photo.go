package handler

import (
	"context"
	"errors"
	"net/url"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func (h *Handler) ListCloudPhotos(ctx context.Context, params gen.ListCloudPhotosParams) (gen.ListCloudPhotosRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return cloudPhotosUnauthorized(), nil
	}

	result, err := h.cloudPhotos.List(ctx, userID, params.Page.Or(1), params.PageSize.Or(20), dbProcessingStatus(params.Status))
	if errors.Is(err, service.ErrInvalidCloudPhotoRequest) {
		return &gen.Error{
			Code:    "INVALID_REQUEST",
			Message: "page は 1 以上、page_size は 1〜100 で指定してください",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	items := make([]gen.CloudPhoto, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, cloudPhotoListItemResponse(item))
	}

	return &gen.CloudPhotoList{
		Items: items,
		Pagination: gen.Pagination{
			Page:       result.Page,
			PageSize:   result.PageSize,
			TotalItems: result.TotalItems,
			TotalPages: result.TotalPages,
		},
	}, nil
}

func (h *Handler) UploadCloudPhoto(ctx context.Context, req *gen.UploadCloudPhotoReq) (gen.UploadCloudPhotoRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return uploadCloudPhotoUnauthorized(), nil
	}
	if req.Image.File == nil {
		return uploadCloudPhotoBadRequest(), nil
	}

	photo, err := h.cloudPhotos.Create(ctx, service.CreateCloudPhotoInput{
		UserID:         userID,
		Filename:       req.Image.Name,
		Size:           req.Image.Size,
		CapturedAt:     req.CapturedAt.Value,
		CapturedAtSet:  req.CapturedAt.Set,
		Latitude:       req.Latitude.Value,
		LatitudeSet:    req.Latitude.Set,
		Longitude:      req.Longitude.Value,
		LongitudeSet:   req.Longitude.Set,
		AutoProcess:    req.AutoProcess.Value,
		AutoProcessSet: req.AutoProcess.Set,
	})
	if errors.Is(err, service.ErrCloudPhotoTooLarge) {
		return &gen.UploadCloudPhotoRequestEntityTooLarge{
			Code:    "FILE_TOO_LARGE",
			Message: "ファイルサイズが上限を超えています",
		}, nil
	}
	if errors.Is(err, service.ErrInvalidCloudPhotoRequest) {
		return uploadCloudPhotoBadRequest(), nil
	}
	if err != nil {
		return nil, err
	}

	return cloudPhotoDetailResponse(photo), nil
}

func (h *Handler) GetCloudPhoto(ctx context.Context, params gen.GetCloudPhotoParams) (gen.GetCloudPhotoRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return getCloudPhotoUnauthorized(), nil
	}

	photo, err := h.cloudPhotos.Get(ctx, userID, params.PhotoId)
	if errors.Is(err, service.ErrCloudPhotoNotFound) {
		return getCloudPhotoNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	return cloudPhotoDetailResponse(photo), nil
}

func (h *Handler) DeleteCloudPhoto(ctx context.Context, params gen.DeleteCloudPhotoParams) (gen.DeleteCloudPhotoRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return deleteCloudPhotoUnauthorized(), nil
	}

	err := h.cloudPhotos.Delete(ctx, userID, params.PhotoId)
	if errors.Is(err, service.ErrCloudPhotoNotFound) {
		return deleteCloudPhotoNotFound(), nil
	}
	if errors.Is(err, service.ErrCloudPhotoConflict) {
		return &gen.DeleteCloudPhotoConflict{
			Code:    "CLOUD_PHOTO_REGISTERED",
			Message: "コレクション登録済みのため削除できません",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return &gen.DeleteCloudPhotoNoContent{}, nil
}

func cloudPhotoListItemResponse(item repository.CloudPhotoListItem) gen.CloudPhoto {
	return gen.CloudPhoto{
		ID:               item.ID,
		UserID:           item.UserID,
		OriginalImageURL: urlValue(item.OriginalImageURL),
		Status:           apiProcessingStatus(item.Status),
		CapturedAt:       apiNilDateTime(item.CapturedAt),
		Location:         apiLocation(item.Latitude, item.Longitude),
		AnimalID:         apiNilUUID(item.AnimalID),
		CreatedAt:        item.CreatedAt.Time,
		UpdatedAt:        gen.NewOptDateTime(item.UpdatedAt.Time),
	}
}

func cloudPhotoDetailResponse(item repository.CloudPhotoDetail) *gen.CloudPhoto {
	photo := cloudPhotoListItemResponse(repository.CloudPhotoListItem{
		ID:               item.ID,
		UserID:           item.UserID,
		OriginalImageURL: item.OriginalImageURL,
		Status:           item.Status,
		CapturedAt:       item.CapturedAt,
		Latitude:         item.Latitude,
		Longitude:        item.Longitude,
		CreatedAt:        item.CreatedAt,
		UpdatedAt:        item.UpdatedAt,
		AnimalID:         item.AnimalID,
	})
	photo.Processing = apiProcessingJob(item)
	return &photo
}

func apiProcessingJob(item repository.CloudPhotoDetail) gen.OptProcessingJob {
	if !item.ProcessingJobID.Valid {
		return gen.OptProcessingJob{}
	}

	job := gen.ProcessingJob{
		ID:          uuid.UUID(item.ProcessingJobID.Bytes),
		PhotoID:     item.ID,
		Status:      gen.ProcessingStatus(item.ProcessingStatus.String),
		StartedAt:   apiNilDateTime(item.StartedAt),
		CompletedAt: apiNilDateTime(item.CompletedAt),
		CreatedAt:   item.ProcessingCreatedAt.Time,
	}
	if item.SuggestedAnimal.Valid && item.Confidence.Valid && item.DoodleImageURL.Valid && item.CompositeImageURL.Valid {
		job.Result.SetTo(gen.ProcessingResult{
			SuggestedAnimal:   item.SuggestedAnimal.String,
			Confidence:        float32(item.Confidence.Float64),
			Description:       apiString(item.Description),
			DoodleImageURL:    urlValue(item.DoodleImageURL.String),
			CompositeImageURL: urlValue(item.CompositeImageURL.String),
		})
	}
	if item.ErrorCode.Valid || item.ErrorMessage.Valid {
		job.Error.SetTo(gen.ProcessingJobError{
			Code:    apiString(item.ErrorCode),
			Message: apiString(item.ErrorMessage),
		})
	}

	return gen.NewOptProcessingJob(job)
}

func dbProcessingStatus(status gen.OptProcessingStatus) dbgen.NullProcessingStatus {
	value, ok := status.Get()
	if !ok {
		return dbgen.NullProcessingStatus{}
	}
	return dbgen.NullProcessingStatus{
		ProcessingStatus: dbgen.ProcessingStatus(value),
		Valid:            true,
	}
}

func apiProcessingStatus(status dbgen.ProcessingStatus) gen.ProcessingStatus {
	return gen.ProcessingStatus(status)
}

func apiNilDateTime(value pgtype.Timestamptz) gen.OptNilDateTime {
	if !value.Valid {
		var opt gen.OptNilDateTime
		opt.SetToNull()
		return opt
	}
	return gen.NewOptNilDateTime(value.Time)
}

func apiLocation(latitude, longitude pgtype.Float8) gen.OptNilGeoLocation {
	var opt gen.OptNilGeoLocation
	if !latitude.Valid || !longitude.Valid {
		opt.SetToNull()
		return opt
	}
	opt.SetTo(gen.GeoLocation{
		Latitude:  latitude.Float64,
		Longitude: longitude.Float64,
	})
	return opt
}

func apiNilUUID(value pgtype.UUID) gen.OptNilUUID {
	var opt gen.OptNilUUID
	if !value.Valid {
		opt.SetToNull()
		return opt
	}
	opt.SetTo(uuid.UUID(value.Bytes))
	return opt
}

func apiString(value pgtype.Text) gen.OptString {
	if !value.Valid {
		return gen.OptString{}
	}
	return gen.NewOptString(value.String)
}

func urlValue(raw string) url.URL {
	parsed, err := url.Parse(raw)
	if err == nil {
		return *parsed
	}
	return url.URL{Path: raw}
}

func cloudPhotosUnauthorized() *gen.Error {
	return unauthorizedError()
}

func getCloudPhotoUnauthorized() *gen.GetCloudPhotoUnauthorized {
	return &gen.GetCloudPhotoUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func uploadCloudPhotoUnauthorized() *gen.UploadCloudPhotoUnauthorized {
	return &gen.UploadCloudPhotoUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func deleteCloudPhotoUnauthorized() *gen.DeleteCloudPhotoUnauthorized {
	return &gen.DeleteCloudPhotoUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func getCloudPhotoNotFound() *gen.GetCloudPhotoNotFound {
	return &gen.GetCloudPhotoNotFound{
		Code:    "CLOUD_PHOTO_NOT_FOUND",
		Message: "雲の写真が見つかりません",
	}
}

func deleteCloudPhotoNotFound() *gen.DeleteCloudPhotoNotFound {
	return &gen.DeleteCloudPhotoNotFound{
		Code:    "CLOUD_PHOTO_NOT_FOUND",
		Message: "雲の写真が見つかりません",
	}
}

func uploadCloudPhotoBadRequest() *gen.UploadCloudPhotoBadRequest {
	return &gen.UploadCloudPhotoBadRequest{
		Code:    "INVALID_REQUEST",
		Message: "画像、撮影日時、位置情報の指定を確認してください",
	}
}
