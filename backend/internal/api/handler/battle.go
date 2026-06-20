package handler

import (
	"context"
	"errors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func (h *Handler) CreateBattle(ctx context.Context, req *gen.CreateBattleRequest) (gen.CreateBattleRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return createBattleUnauthorized(), nil
	}

	result, err := h.battles.Create(ctx, service.CreateBattleInput{
		UserID:       userID,
		ChallengerID: req.ChallengerID,
		DefenderID:   req.DefenderID,
	})
	if errors.Is(err, service.ErrInvalidBattleRequest) {
		return createBattleBadRequest(), nil
	}
	if errors.Is(err, service.ErrBattleNotFound) {
		return createBattleNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	res := battleResponse(result)
	return &res, nil
}

func battleResponse(result service.BattleResult) gen.BattleResult {
	logs := make([]gen.BattleTurnLog, 0, len(result.BattleLog))
	for _, item := range result.BattleLog {
		actions := make([]gen.BattleAction, 0, len(item.Actions))
		for _, action := range item.Actions {
			actions = append(actions, gen.BattleAction{
				Type:   gen.BattleActionType(action.Type),
				Hit:    gen.NewOptBool(action.Hit),
				Damage: gen.NewOptInt(action.Damage),
			})
		}
		logs = append(logs, gen.BattleTurnLog{
			Actor:   battleParticipant(item.Actor),
			Actions: actions,
		})
	}

	return gen.BattleResult{
		InitialStatus: gen.BattleInitialStatus{
			Challenger: battleStatusResponse(result.InitialStatus.Challenger),
			Defender:   battleStatusResponse(result.InitialStatus.Defender),
		},
		Winner:    battleParticipant(result.Winner),
		BattleLog: logs,
	}
}

func battleStatusResponse(status service.BattleStatus) gen.BattleStatus {
	return gen.BattleStatus{
		Hp:      status.HP,
		Attack:  status.Attack,
		Evasion: status.Evasion,
		Defense: status.Defense,
	}
}

func battleParticipant(participant service.BattleParticipant) gen.BattleParticipantRole {
	return gen.BattleParticipantRole(participant)
}

func createBattleBadRequest() *gen.CreateBattleBadRequest {
	return &gen.CreateBattleBadRequest{
		Code:    "INVALID_BATTLE_REQUEST",
		Message: "バトルに参加する動物とステータスを確認してください",
	}
}

func createBattleUnauthorized() *gen.CreateBattleUnauthorized {
	return &gen.CreateBattleUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func createBattleNotFound() *gen.CreateBattleNotFound {
	return &gen.CreateBattleNotFound{
		Code:    "ANIMAL_NOT_FOUND",
		Message: "バトルに参加する動物が見つかりません",
	}
}
