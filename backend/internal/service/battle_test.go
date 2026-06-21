package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

func TestBattleServiceCreateChallengerWins(t *testing.T) {
	userID := uuid.New()
	challengerID := uuid.New()
	defenderID := uuid.New()

	service := NewBattleService(fakeBattleAnimals{
		animals: map[uuid.UUID]dbgen.Animal{
			challengerID: battleAnimal(challengerID, userID, 20, 10, 0, 2),
			defenderID:   battleAnimal(defenderID, userID, 12, 6, 0, 4),
		},
	})
	service.randomInt = func(int) int { return 0 }

	result, err := service.Create(context.Background(), CreateBattleInput{
		UserID:       userID,
		ChallengerID: challengerID,
		DefenderID:   defenderID,
	})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if result.Winner != BattleParticipantChallenger {
		t.Fatalf("Winner = %s", result.Winner)
	}
	if result.InitialStatus.Challenger.HP != 20 {
		t.Fatalf("InitialStatus.Challenger.HP = %d", result.InitialStatus.Challenger.HP)
	}
	if len(result.BattleLog) != 4 {
		t.Fatalf("BattleLog length = %d", len(result.BattleLog))
	}
	if result.BattleLog[0].Actions[0].Damage != 6 {
		t.Fatalf("challenger first damage = %d", result.BattleLog[0].Actions[0].Damage)
	}
	if !result.BattleLog[0].Actions[0].Hit {
		t.Fatal("challenger first attack missed")
	}
}

func TestBattleServiceCreateUsesDefenderEvasionAsDodgeRate(t *testing.T) {
	userID := uuid.New()
	challengerID := uuid.New()
	defenderID := uuid.New()

	service := NewBattleService(fakeBattleAnimals{
		animals: map[uuid.UUID]dbgen.Animal{
			challengerID: battleAnimal(challengerID, userID, 10, 20, 0, 0),
			defenderID:   battleAnimal(defenderID, userID, 10, 1, 100, 0),
		},
	})
	service.randomInt = func(int) int { return 0 }

	result, err := service.Create(context.Background(), CreateBattleInput{
		UserID:       userID,
		ChallengerID: challengerID,
		DefenderID:   defenderID,
	})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if result.BattleLog[0].Actions[0].Hit {
		t.Fatal("challenger attack hit despite defender evasion 100")
	}
}

func TestBattleServiceCreateAllowsDefenderOwnedByOtherUser(t *testing.T) {
	userID := uuid.New()
	otherUserID := uuid.New()
	challengerID := uuid.New()
	defenderID := uuid.New()

	service := NewBattleService(fakeBattleAnimals{
		animals: map[uuid.UUID]dbgen.Animal{
			challengerID: battleAnimal(challengerID, userID, 20, 10, 0, 2),
			defenderID:   battleAnimal(defenderID, otherUserID, 12, 6, 0, 4),
		},
	})
	service.randomInt = func(int) int { return 0 }

	result, err := service.Create(context.Background(), CreateBattleInput{
		UserID:       userID,
		ChallengerID: challengerID,
		DefenderID:   defenderID,
	})
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if result.InitialStatus.Defender.HP != 12 {
		t.Fatalf("InitialStatus.Defender.HP = %d", result.InitialStatus.Defender.HP)
	}
}

func TestBattleServiceCreateRejectsSameAnimal(t *testing.T) {
	userID := uuid.New()
	animalID := uuid.New()
	service := NewBattleService(fakeBattleAnimals{})

	_, err := service.Create(context.Background(), CreateBattleInput{
		UserID:       userID,
		ChallengerID: animalID,
		DefenderID:   animalID,
	})
	if !errors.Is(err, ErrInvalidBattleRequest) {
		t.Fatalf("Create() error = %v", err)
	}
}

func TestBattleServiceCreateRejectsBattleWithoutPossibleDamage(t *testing.T) {
	userID := uuid.New()
	challengerID := uuid.New()
	defenderID := uuid.New()

	service := NewBattleService(fakeBattleAnimals{
		animals: map[uuid.UUID]dbgen.Animal{
			challengerID: battleAnimal(challengerID, userID, 10, 1, 0, 10),
			defenderID:   battleAnimal(defenderID, userID, 10, 1, 0, 10),
		},
	})

	_, err := service.Create(context.Background(), CreateBattleInput{
		UserID:       userID,
		ChallengerID: challengerID,
		DefenderID:   defenderID,
	})
	if !errors.Is(err, ErrInvalidBattleRequest) {
		t.Fatalf("Create() error = %v", err)
	}
}

type fakeBattleAnimals struct {
	animals map[uuid.UUID]dbgen.Animal
}

func (f fakeBattleAnimals) Get(_ context.Context, userID, animalID uuid.UUID) (dbgen.Animal, error) {
	animal, ok := f.animals[animalID]
	if !ok || animal.UserID != userID {
		return dbgen.Animal{}, ErrAnimalNotFound
	}
	return animal, nil
}

func (f fakeBattleAnimals) GetAny(_ context.Context, animalID uuid.UUID) (dbgen.Animal, error) {
	animal, ok := f.animals[animalID]
	if !ok {
		return dbgen.Animal{}, ErrAnimalNotFound
	}
	return animal, nil
}

func battleAnimal(id, userID uuid.UUID, hp, attack, evasion, defense int32) dbgen.Animal {
	return dbgen.Animal{
		ID:      id,
		UserID:  userID,
		Hp:      hp,
		Attack:  attack,
		Evasion: evasion,
		Defense: defense,
	}
}
