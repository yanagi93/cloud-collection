package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
)

var ErrProcessingJobNotFound = errors.New("processing job not found")
var ErrProcessingJobConflict = errors.New("processing job conflict")

type ProcessingService struct {
	photos      *CloudPhotoService
	jobs        *repository.ProcessingJobRepository
	processor   ImageProcessor
	uploadsRoot string
	timeout     time.Duration
}

func NewProcessingService(photos *CloudPhotoService, jobs *repository.ProcessingJobRepository, processor ImageProcessor, uploadsRoot string) *ProcessingService {
	return &ProcessingService{
		photos:      photos,
		jobs:        jobs,
		processor:   processor,
		uploadsRoot: uploadsRoot,
		timeout:     2 * time.Minute,
	}
}

func (s *ProcessingService) Start(ctx context.Context, userID, photoID uuid.UUID) (dbgen.ProcessingJob, error) {
	photo, err := s.photos.Get(ctx, userID, photoID)
	if err != nil {
		return dbgen.ProcessingJob{}, err
	}

	job, err := s.jobs.Create(ctx, photoID)
	if isUniqueViolationCode(err) {
		return dbgen.ProcessingJob{}, ErrProcessingJobConflict
	}
	if err != nil {
		return dbgen.ProcessingJob{}, err
	}

	go s.run(job.ID, photo.OriginalImageURL)
	return job, nil
}

func (s *ProcessingService) GetLatest(ctx context.Context, userID, photoID uuid.UUID) (dbgen.ProcessingJob, error) {
	if _, err := s.photos.Get(ctx, userID, photoID); err != nil {
		return dbgen.ProcessingJob{}, err
	}

	job, err := s.jobs.GetLatestByPhotoID(ctx, photoID, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return dbgen.ProcessingJob{}, ErrProcessingJobNotFound
	}
	return job, err
}

func (s *ProcessingService) run(jobID uuid.UUID, originalImageURL string) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()

	job, err := s.jobs.MarkStarted(ctx, jobID)
	if err != nil {
		return
	}
	_, _ = s.jobs.SyncPhotoStatus(ctx, job.ID)

	imagePath, err := uploadURLPath(s.uploadsRoot, originalImageURL)
	if err != nil {
		s.fail(ctx, job.ID, "IMAGE_NOT_FOUND", "元画像ファイルが見つかりません")
		return
	}
	image, mimeType, err := readImage(imagePath)
	if err != nil {
		s.fail(ctx, job.ID, "IMAGE_NOT_FOUND", "元画像ファイルを読み込めません")
		return
	}

	result, err := s.processor.Process(ctx, ImageProcessingInput{
		Image:    image,
		MIMEType: mimeType,
		JobID:    job.ID,
		PhotoID:  job.PhotoID,
	})
	if err != nil {
		s.fail(ctx, job.ID, "AI_INFERENCE_FAILED", err.Error())
		return
	}

	compositeURL, err := s.writeGeneratedImage(job.ID, result)
	if err != nil {
		s.fail(ctx, job.ID, "IMAGE_WRITE_FAILED", "生成画像の保存に失敗しました")
		return
	}

	completed, err := s.jobs.Complete(ctx, dbgen.CompleteProcessingJobParams{
		ID:                job.ID,
		SuggestedAnimal:   text(result.SuggestedAnimal, true),
		Confidence:        pgtype.Float8{Float64: result.Confidence, Valid: true},
		Description:       text(result.Description, strings.TrimSpace(result.Description) != ""),
		CompositeImageUrl: text(compositeURL, true),
	})
	if err != nil {
		s.fail(ctx, job.ID, "JOB_UPDATE_FAILED", "処理ジョブの完了更新に失敗しました")
		return
	}
	_, _ = s.jobs.SyncPhotoStatus(ctx, completed.ID)
}

func (s *ProcessingService) fail(ctx context.Context, jobID uuid.UUID, code, message string) {
	failed, err := s.jobs.Fail(ctx, dbgen.FailProcessingJobParams{
		ID:           jobID,
		ErrorCode:    text(code, true),
		ErrorMessage: text(message, true),
	})
	if err == nil {
		_, _ = s.jobs.SyncPhotoStatus(ctx, failed.ID)
	}
}

func (s *ProcessingService) writeGeneratedImage(jobID uuid.UUID, result ImageProcessingOutput) (string, error) {
	dir := filepath.Join(s.uploadsRoot, "processing-jobs", jobID.String())
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	compositeExt := imageExt(result.CompositeMIMEType)
	compositePath := filepath.Join(dir, "composite"+compositeExt)

	if err := os.WriteFile(compositePath, result.CompositeImage, 0o644); err != nil {
		return "", err
	}

	return "/uploads/processing-jobs/" + jobID.String() + "/composite" + compositeExt, nil
}

func readImage(path string) ([]byte, string, error) {
	image, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}

	mimeType := mime.TypeByExtension(filepath.Ext(path))
	if mimeType == "" {
		mimeType = http.DetectContentType(image)
	}
	return image, mimeType, nil
}

func uploadURLPath(root, rawURL string) (string, error) {
	rel, ok := strings.CutPrefix(rawURL, "/uploads/")
	if !ok || rel == "" {
		return "", ErrCloudPhotoNotFound
	}
	clean := filepath.Clean(rel)
	if strings.HasPrefix(clean, "..") || filepath.IsAbs(clean) {
		return "", ErrCloudPhotoNotFound
	}
	return filepath.Join(root, clean), nil
}

func imageExt(mimeType string) string {
	switch strings.ToLower(strings.TrimSpace(mimeType)) {
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	default:
		return ".png"
	}
}

type ImageProcessor interface {
	Process(ctx context.Context, input ImageProcessingInput) (ImageProcessingOutput, error)
}

type ImageProcessingInput struct {
	Image    []byte
	MIMEType string
	JobID    uuid.UUID
	PhotoID  uuid.UUID
}

type ImageProcessingOutput struct {
	SuggestedAnimal   string
	Confidence        float64
	Description       string
	CompositeImage    []byte
	CompositeMIMEType string
}

type NanoBananaProcessor struct {
	apiKey   string
	model    string
	endpoint string
	client   *http.Client
}

func NewNanoBananaProcessor(apiKey, model, endpoint string) *NanoBananaProcessor {
	return &NanoBananaProcessor{
		apiKey:   apiKey,
		model:    model,
		endpoint: endpoint,
		client:   &http.Client{Timeout: 90 * time.Second},
	}
}

func (p *NanoBananaProcessor) Process(ctx context.Context, input ImageProcessingInput) (ImageProcessingOutput, error) {
	if strings.TrimSpace(p.apiKey) == "" {
		return ImageProcessingOutput{}, errors.New("Nano Banana 2 API key is not configured")
	}

	composite, err := p.generate(ctx, input, compositePrompt)
	if err != nil {
		return ImageProcessingOutput{}, err
	}

	compositeImage, compositeMIME := generatedImage(composite, input)
	metadata, err := p.generate(ctx, ImageProcessingInput{
		Image:    compositeImage,
		MIMEType: compositeMIME,
		JobID:    input.JobID,
		PhotoID:  input.PhotoID,
	}, metadataPrompt)
	if err != nil {
		return ImageProcessingOutput{}, err
	}
	parsed := parseMetadata(metadata.Text())

	return ImageProcessingOutput{
		SuggestedAnimal:   parsed.SuggestedAnimal,
		Confidence:        parsed.Confidence,
		Description:       parsed.Description,
		CompositeImage:    compositeImage,
		CompositeMIMEType: compositeMIME,
	}, nil
}

func (p *NanoBananaProcessor) generate(ctx context.Context, input ImageProcessingInput, prompt string) (geminiResponse, error) {
	body := geminiRequest{
		Contents: []geminiContent{
			{
				Role: "user",
				Parts: []geminiPart{
					{Text: prompt},
					{
						InlineData: &geminiInlineData{
							MIMEType: input.MIMEType,
							Data:     base64.StdEncoding.EncodeToString(input.Image),
						},
					},
				},
			},
		},
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return geminiResponse{}, err
	}

	endpoint := fmt.Sprintf(p.endpoint, p.model)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return geminiResponse{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", p.apiKey)

	res, err := p.client.Do(req)
	if err != nil {
		return geminiResponse{}, err
	}
	defer res.Body.Close()

	resBody, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return geminiResponse{}, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return geminiResponse{}, fmt.Errorf("Nano Banana 2 API returned %s: %s", res.Status, strings.TrimSpace(string(resBody)))
	}

	var decoded geminiResponse
	if err := json.Unmarshal(resBody, &decoded); err != nil {
		return geminiResponse{}, err
	}
	return decoded, nil
}

const compositePrompt = `与えられた雲の画像から動物を連想して、黒のマーカーで動物に見えるように綺麗に加筆してください。雲の一部だけを使っても構わない。雲自体の形を変えることは絶対にしてはならない。`

const metadataPrompt = `Analyze this edited cloud photo after black marker doodle lines were added.
Infer what animal the final doodle and cloud silhouette depict.
Return only compact JSON with keys suggested_animal, confidence, description.
suggested_animal must be a short Japanese animal name.
confidence must be a number from 0 to 1.
description must be Japanese and should briefly explain which visible lines or cloud features make it look like that animal.`

type processingMetadata struct {
	SuggestedAnimal string  `json:"suggested_animal"`
	Confidence      float64 `json:"confidence"`
	Description     string  `json:"description"`
}

func parseMetadata(raw string) processingMetadata {
	raw = strings.TrimSpace(raw)
	raw = strings.Trim(raw, "`")
	raw = strings.TrimPrefix(raw, "json")
	raw = strings.TrimSpace(raw)

	var metadata processingMetadata
	if err := json.Unmarshal([]byte(raw), &metadata); err != nil {
		return processingMetadata{
			SuggestedAnimal: "どうぶつ",
			Confidence:      0.5,
			Description:     "雲の形から動物を連想しました。",
		}
	}
	if strings.TrimSpace(metadata.SuggestedAnimal) == "" {
		metadata.SuggestedAnimal = "どうぶつ"
	}
	if metadata.Confidence < 0 || metadata.Confidence > 1 {
		metadata.Confidence = 0.5
	}
	return metadata
}

func generatedImage(response geminiResponse, fallback ImageProcessingInput) ([]byte, string) {
	for _, candidate := range response.Candidates {
		for _, part := range candidate.Content.Parts {
			inlineData := part.GetInlineData()
			if inlineData != nil && inlineData.Data != "" {
				image, err := base64.StdEncoding.DecodeString(inlineData.Data)
				if err == nil {
					return image, inlineData.GetMIMEType()
				}
			}
		}
	}
	return fallback.Image, fallback.MIMEType
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text            string            `json:"text,omitempty"`
	InlineData      *geminiInlineData `json:"inline_data,omitempty"`
	InlineDataCamel *geminiInlineData `json:"inlineData,omitempty"`
}

type geminiInlineData struct {
	MIMEType      string `json:"mime_type,omitempty"`
	MIMETypeCamel string `json:"mimeType,omitempty"`
	Data          string `json:"data"`
}

func (p geminiPart) GetInlineData() *geminiInlineData {
	if p.InlineData != nil {
		return p.InlineData
	}
	return p.InlineDataCamel
}

func (d geminiInlineData) GetMIMEType() string {
	if d.MIMEType != "" {
		return d.MIMEType
	}
	return d.MIMETypeCamel
}

type geminiResponse struct {
	Candidates []struct {
		Content geminiContent `json:"content"`
	} `json:"candidates"`
}

func (r geminiResponse) Text() string {
	var parts []string
	for _, candidate := range r.Candidates {
		for _, part := range candidate.Content.Parts {
			if part.Text != "" {
				parts = append(parts, part.Text)
			}
		}
	}
	return strings.Join(parts, "\n")
}

func text(value string, valid bool) pgtype.Text {
	return pgtype.Text{String: value, Valid: valid}
}

func isUniqueViolationCode(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
