package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
)

func TestNanoBananaProcessorProcessGeneratesImageBeforeMetadata(t *testing.T) {
	generatedImage := []byte("generated-image")
	var prompts []string
	var inlineImages []string
	var inlineMIMEs []string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req geminiRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if len(req.Contents) != 1 || len(req.Contents[0].Parts) != 2 {
			t.Fatalf("unexpected request parts: %#v", req.Contents)
		}

		prompts = append(prompts, req.Contents[0].Parts[0].Text)
		inline := req.Contents[0].Parts[1].GetInlineData()
		if inline == nil {
			t.Fatal("inline image is nil")
		}
		inlineImages = append(inlineImages, inline.Data)
		inlineMIMEs = append(inlineMIMEs, inline.GetMIMEType())

		w.Header().Set("Content-Type", "application/json")
		switch len(prompts) {
		case 1:
			_ = json.NewEncoder(w).Encode(geminiResponse{
				Candidates: []struct {
					Content geminiContent `json:"content"`
				}{
					{
						Content: geminiContent{
							Parts: []geminiPart{
								{
									InlineData: &geminiInlineData{
										MIMEType: "image/png",
										Data:     base64.StdEncoding.EncodeToString(generatedImage),
									},
								},
							},
						},
					},
				},
			})
		case 2:
			_ = json.NewEncoder(w).Encode(geminiResponse{
				Candidates: []struct {
					Content geminiContent `json:"content"`
				}{
					{
						Content: geminiContent{
							Parts: []geminiPart{
								{
									Text: `{"suggested_animal":"ねこ","confidence":0.9,"description":"加筆後の線が猫に見える"}`,
								},
							},
						},
					},
				},
			})
		default:
			t.Fatalf("unexpected request count: %d", len(prompts))
		}
	}))
	defer server.Close()

	processor := NewNanoBananaProcessor("test-key", "test-model", server.URL+"/%s")
	result, err := processor.Process(context.Background(), ImageProcessingInput{
		Image:    []byte("original-image"),
		MIMEType: "image/jpeg",
		JobID:    uuid.New(),
		PhotoID:  uuid.New(),
	})
	if err != nil {
		t.Fatalf("Process() error = %v", err)
	}

	if len(prompts) != 2 {
		t.Fatalf("request count = %d", len(prompts))
	}
	if prompts[0] != compositePrompt {
		t.Fatalf("first prompt = %q", prompts[0])
	}
	if prompts[1] != metadataPrompt {
		t.Fatalf("second prompt = %q", prompts[1])
	}
	if inlineImages[0] != base64.StdEncoding.EncodeToString([]byte("original-image")) {
		t.Fatalf("first inline image was not original image")
	}
	if inlineImages[1] != base64.StdEncoding.EncodeToString(generatedImage) {
		t.Fatalf("second inline image was not generated image")
	}
	if inlineMIMEs[1] != "image/png" {
		t.Fatalf("second inline MIME = %q", inlineMIMEs[1])
	}
	if string(result.CompositeImage) != string(generatedImage) {
		t.Fatalf("CompositeImage = %q", string(result.CompositeImage))
	}
	if result.SuggestedAnimal != "ねこ" {
		t.Fatalf("SuggestedAnimal = %q", result.SuggestedAnimal)
	}
}
