package service

import (
	"context"
	"errors"
	"math/rand"

	"github.com/google/uuid"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

var ErrBattleNotFound = errors.New("battle animal not found")
var ErrInvalidBattleRequest = errors.New("invalid battle request")

const maxBattleTurns = 10000

type battleAnimalGetter interface {
	Get(ctx context.Context, userID, animalID uuid.UUID) (dbgen.Animal, error)
	GetAny(ctx context.Context, animalID uuid.UUID) (dbgen.Animal, error)
}

type BattleService struct {
	animals   battleAnimalGetter
	randomInt func(int) int
}

func NewBattleService(animals battleAnimalGetter) *BattleService {
	return &BattleService{
		animals:   animals,
		randomInt: rand.Intn,
	}
}

type CreateBattleInput struct {
	UserID       uuid.UUID
	ChallengerID uuid.UUID
	DefenderID   uuid.UUID
}

type BattleParticipant string

const (
	BattleParticipantChallenger BattleParticipant = "challenger"
	BattleParticipantDefender   BattleParticipant = "defender"
)

type BattleStatus struct {
	HP      int
	Attack  int
	Evasion int
	Defense int
}

type BattleInitialStatus struct {
	Challenger BattleStatus
	Defender   BattleStatus
}

type BattleAction struct {
	Type   string
	Hit    bool
	Damage int
}

type BattleTurnLog struct {
	Actor   BattleParticipant
	Actions []BattleAction
}

type BattleResult struct {
	InitialStatus BattleInitialStatus
	Winner        BattleParticipant
	BattleLog     []BattleTurnLog
}

func (s *BattleService) Create(ctx context.Context, input CreateBattleInput) (BattleResult, error) {
	if input.ChallengerID == input.DefenderID {
		return BattleResult{}, ErrInvalidBattleRequest
	}

	challenger, err := s.animals.Get(ctx, input.UserID, input.ChallengerID)
	if errors.Is(err, ErrAnimalNotFound) {
		return BattleResult{}, ErrBattleNotFound
	}
	if err != nil {
		return BattleResult{}, err
	}

	defender, err := s.animals.GetAny(ctx, input.DefenderID)
	if errors.Is(err, ErrAnimalNotFound) {
		return BattleResult{}, ErrBattleNotFound
	}
	if err != nil {
		return BattleResult{}, err
	}

	challengerStatus := battleStatus(challenger)
	defenderStatus := battleStatus(defender)
	if challengerStatus.HP <= 0 || defenderStatus.HP <= 0 {
		return BattleResult{}, ErrInvalidBattleRequest
	}
	if !canDealDamage(challengerStatus, defenderStatus) && !canDealDamage(defenderStatus, challengerStatus) {
		return BattleResult{}, ErrInvalidBattleRequest
	}

	challengerHP := challengerStatus.HP
	defenderHP := defenderStatus.HP
	logs := make([]BattleTurnLog, 0, 16)

	for turn := 0; turn < maxBattleTurns && challengerHP > 0 && defenderHP > 0; turn++ {
		challengerAliveAtStart := challengerHP > 0
		defenderAliveAtStart := defenderHP > 0

		if challengerAliveAtStart {
			action, damage := s.attack(challengerStatus, defenderStatus)
			defenderHP -= damage
			logs = append(logs, BattleTurnLog{
				Actor:   BattleParticipantChallenger,
				Actions: []BattleAction{action},
			})
		}

		if defenderAliveAtStart {
			action, damage := s.attack(defenderStatus, challengerStatus)
			challengerHP -= damage
			logs = append(logs, BattleTurnLog{
				Actor:   BattleParticipantDefender,
				Actions: []BattleAction{action},
			})
		}
	}

	if challengerHP > 0 && defenderHP > 0 {
		return BattleResult{}, ErrInvalidBattleRequest
	}

	return BattleResult{
		InitialStatus: BattleInitialStatus{
			Challenger: challengerStatus,
			Defender:   defenderStatus,
		},
		Winner:    battleWinner(challengerHP, defenderHP),
		BattleLog: logs,
	}, nil
}

func (s *BattleService) attack(attacker, defender BattleStatus) (BattleAction, int) {
	hit := s.randomInt(100) < hitChance(defender)
	damage := 0
	if hit {
		damage = attackDamage(attacker, defender)
	}

	return BattleAction{
		Type:   "attack",
		Hit:    hit,
		Damage: damage,
	}, damage
}

func battleStatus(animal dbgen.Animal) BattleStatus {
	return BattleStatus{
		HP:      int(animal.Hp),
		Attack:  int(animal.Attack),
		Evasion: int(animal.Evasion),
		Defense: int(animal.Defense),
	}
}

func canDealDamage(attacker, defender BattleStatus) bool {
	return hitChance(defender) > 0 && attackDamage(attacker, defender) > 0
}

func hitChance(defender BattleStatus) int {
	chance := 100 - defender.Evasion
	if chance < 0 {
		return 0
	}
	if chance > 100 {
		return 100
	}
	return chance
}

func attackDamage(attacker, defender BattleStatus) int {
	damage := attacker.Attack - defender.Defense
	if damage < 0 {
		return 0
	}
	return damage
}

func battleWinner(challengerHP, defenderHP int) BattleParticipant {
	if challengerHP > defenderHP {
		return BattleParticipantChallenger
	}
	if defenderHP > challengerHP {
		return BattleParticipantDefender
	}
	return BattleParticipantChallenger
}
