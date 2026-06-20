package service

import (
	"strings"
	"testing"
)

func TestParseMetadataKeepsVisualCues(t *testing.T) {
	raw := "```json\n" + `{
		"suggested_animal": "うさぎ",
		"confidence": 0.8,
		"description": "右側の突起が耳に見える",
		"visual_cues": [
			{
				"region": "右上",
				"cloud_feature": "細長い突起",
				"animal_part": "耳",
				"reason": "耳のように上へ伸びている"
			}
		],
		"drawing_plan": ["右上の突起に沿って耳の輪郭を描く"]
	}` + "\n```"

	metadata := parseMetadata(raw)

	if metadata.SuggestedAnimal != "うさぎ" {
		t.Fatalf("SuggestedAnimal = %q", metadata.SuggestedAnimal)
	}
	if len(metadata.VisualCues) != 1 {
		t.Fatalf("VisualCues length = %d", len(metadata.VisualCues))
	}
	if metadata.VisualCues[0].AnimalPart != "耳" {
		t.Fatalf("AnimalPart = %q", metadata.VisualCues[0].AnimalPart)
	}
	if len(metadata.DrawingPlan) != 1 {
		t.Fatalf("DrawingPlan length = %d", len(metadata.DrawingPlan))
	}
}

func TestCompositePromptIncludesMetadataBridge(t *testing.T) {
	prompt := compositePrompt(processingMetadata{
		SuggestedAnimal: "うさぎ",
		Description:     "右側の突起が耳に見える",
		VisualCues: []processingCue{
			{
				Region:       "右上",
				CloudFeature: "細長い突起",
				AnimalPart:   "耳",
				Reason:       "耳のように上へ伸びている",
			},
		},
		DrawingPlan: []string{"右上の突起に沿って耳の輪郭を描く"},
	})

	for _, want := range []string{
		"うさぎ",
		"判定プロンプトの全体解釈",
		"位置: 右上",
		"動物パーツ: 耳",
		"右上の突起に沿って耳の輪郭を描く",
		"雲の白いシルエットの内側",
		"雲の外側の青空・背景には線を描かない",
		"雲の輪郭やボリュームを描き換えない",
	} {
		if !strings.Contains(prompt, want) {
			t.Fatalf("prompt does not contain %q:\n%s", want, prompt)
		}
	}
}
