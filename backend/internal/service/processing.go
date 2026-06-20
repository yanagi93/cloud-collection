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

	metadata, err := p.generate(ctx, input, metadataPrompt)
	if err != nil {
		return ImageProcessingOutput{}, err
	}
	parsed := parseMetadata(metadata.Text())

	composite, err := p.generate(ctx, input, compositePrompt(parsed))
	if err != nil {
		return ImageProcessingOutput{}, err
	}

	compositeImage, compositeMIME := generatedImage(composite, input)

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

const metadataPrompt = `Analyze this cloud photo and identify one animal suggested by the cloud silhouette.
Return only compact JSON. Do not include markdown.
Required JSON keys:
- suggested_animal: short Japanese animal name.
- confidence: number from 0 to 1.
- description: short Japanese summary of why the whole cloud suggests that animal.
- visual_cues: array of objects. Each object must explain a concrete mapping between the source image and the animal, with keys region, cloud_feature, animal_part, reason. region must describe where in the image or cloud the feature is, such as "中央左", "右上の細い突起", "下側の丸いふくらみ".
- drawing_plan: array of short Japanese instructions for where to add marker lines. The plan must be based only on visual_cues and must not ask to change the cloud shape.
Focus on what part of the original cloud looked like which animal body part.`

func compositePrompt(metadata processingMetadata) string {
	animal := strings.TrimSpace(metadata.SuggestedAnimal)
	if animal == "" {
		animal = "どうぶつ"
	}

	var b strings.Builder
	fmt.Fprintf(&b, "元画像の雲のシルエットから「%s」を連想して、黒いマーカーでアウトラインのみを加筆してください。\n", animal)
	b.WriteString("目的は、雲そのものを動物に変形することではなく、雲のどの部分がどの動物パーツに見えたのかを、最小限の線で読み取りやすくすることです。\n\n")

	description := strings.TrimSpace(metadata.Description)
	if description != "" {
		b.WriteString("判定プロンプトの全体解釈:\n")
		fmt.Fprintf(&b, "- %s\n\n", description)
	}

	if len(metadata.VisualCues) > 0 {
		b.WriteString("元画像で動物に見えた根拠。必ずこの対応関係に沿って描いてください:\n")
		for _, cue := range metadata.VisualCues {
			line := cue.PromptLine()
			if line != "" {
				fmt.Fprintf(&b, "- %s\n", line)
			}
		}
		b.WriteString("\n")
	}

	if len(metadata.DrawingPlan) > 0 {
		b.WriteString("加筆計画。以下を優先してください:\n")
		for _, step := range metadata.DrawingPlan {
			step = strings.TrimSpace(step)
			if step != "" {
				fmt.Fprintf(&b, "- %s\n", step)
			}
		}
		b.WriteString("\n")
	}

	b.WriteString("厳守事項:\n")
	b.WriteString("- 雲、空、写真全体の構図、色、明るさ、質感は変更しない。\n")
	b.WriteString("- 雲の輪郭やボリュームを描き換えない。雲のシルエットをそのまま使う。\n")
	b.WriteString("- 加筆線は雲の白いシルエットの内側、または雲の輪郭線上だけに置く。雲の外側の青空・背景には線を描かない。\n")
	b.WriteString("- 耳、しっぽ、手足などを雲の外へ伸ばして追加しない。雲の外に足りないパーツは描かずに省略する。\n")
	b.WriteString("- 目や鼻などの小さい記号も、必ず雲の内側に収める。雲から離れた独立した線や記号を追加しない。\n")
	b.WriteString("- 加筆は黒いマーカーのアウトラインだけにする。太さは一定で、少しざらつきのある手描き線にする。\n")
	b.WriteString("- 元画像の visual_cues にない動物パーツを大きく追加しない。\n")
	b.WriteString("- 目、鼻、耳、口、手足などは、visual_cues が示す位置と雲の形に沿う場合だけ最小限に描く。\n")
	b.WriteString("- 写実的な動物、塗りつぶし、色付きイラスト、影、別背景、別オブジェクトは追加しない。\n")
	b.WriteString("- 判断が曖昧な部分は描き込みを減らし、破綻しそうな線は省略する。\n")

	return b.String()
}

type processingMetadata struct {
	SuggestedAnimal string          `json:"suggested_animal"`
	Confidence      float64         `json:"confidence"`
	Description     string          `json:"description"`
	VisualCues      []processingCue `json:"visual_cues"`
	DrawingPlan     []string        `json:"drawing_plan"`
}

type processingCue struct {
	Region       string `json:"region"`
	CloudFeature string `json:"cloud_feature"`
	AnimalPart   string `json:"animal_part"`
	Reason       string `json:"reason"`
}

func (c processingCue) PromptLine() string {
	parts := []string{}
	if region := strings.TrimSpace(c.Region); region != "" {
		parts = append(parts, "位置: "+region)
	}
	if feature := strings.TrimSpace(c.CloudFeature); feature != "" {
		parts = append(parts, "雲の特徴: "+feature)
	}
	if part := strings.TrimSpace(c.AnimalPart); part != "" {
		parts = append(parts, "動物パーツ: "+part)
	}
	if reason := strings.TrimSpace(c.Reason); reason != "" {
		parts = append(parts, "理由: "+reason)
	}
	return strings.Join(parts, " / ")
}

func parseMetadata(raw string) processingMetadata {
	raw = extractJSON(raw)

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
	metadata.Description = strings.TrimSpace(metadata.Description)
	metadata.VisualCues = compactCues(metadata.VisualCues)
	metadata.DrawingPlan = compactStrings(metadata.DrawingPlan)
	return metadata
}

func extractJSON(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.Trim(raw, "`")
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "json")
	raw = strings.TrimSpace(raw)

	startObject := strings.Index(raw, "{")
	endObject := strings.LastIndex(raw, "}")
	if startObject >= 0 && endObject > startObject {
		return raw[startObject : endObject+1]
	}
	return raw
}

func compactCues(cues []processingCue) []processingCue {
	compacted := make([]processingCue, 0, len(cues))
	for _, cue := range cues {
		cue.Region = strings.TrimSpace(cue.Region)
		cue.CloudFeature = strings.TrimSpace(cue.CloudFeature)
		cue.AnimalPart = strings.TrimSpace(cue.AnimalPart)
		cue.Reason = strings.TrimSpace(cue.Reason)
		if cue.PromptLine() != "" {
			compacted = append(compacted, cue)
		}
	}
	return compacted
}

func compactStrings(values []string) []string {
	compacted := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			compacted = append(compacted, value)
		}
	}
	return compacted
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
