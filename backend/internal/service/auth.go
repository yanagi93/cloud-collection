package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrEmailAlreadyRegistered = errors.New("email already registered")

type AuthService struct {
	users        *repository.UserRepository
	jwtSecret    []byte
	jwtExpiresIn time.Duration
	now          func() time.Time
}

func NewAuthService(users *repository.UserRepository, jwtSecret string, jwtExpiresIn time.Duration) *AuthService {
	return &AuthService{
		users:        users,
		jwtSecret:    []byte(jwtSecret),
		jwtExpiresIn: jwtExpiresIn,
		now:          time.Now,
	}
}

type LoginResult struct {
	AccessToken string
	ExpiresIn   int
	User        dbgen.User
}

type RegisterResult = LoginResult

func (s *AuthService) Register(ctx context.Context, email, password, displayName string) (RegisterResult, error) {
	email = strings.TrimSpace(email)
	displayName = strings.TrimSpace(displayName)
	if email == "" || password == "" || displayName == "" {
		return RegisterResult{}, ErrInvalidCredentials
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return RegisterResult{}, err
	}

	user, err := s.users.Create(ctx, email, string(passwordHash), displayName)
	if isUniqueViolation(err) {
		return RegisterResult{}, ErrEmailAlreadyRegistered
	}
	if err != nil {
		return RegisterResult{}, err
	}

	return s.issueToken(user)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (LoginResult, error) {
	email = strings.TrimSpace(email)
	if email == "" || password == "" {
		return LoginResult{}, ErrInvalidCredentials
	}

	user, err := s.users.GetByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return LoginResult{}, ErrInvalidCredentials
	}
	if err != nil {
		return LoginResult{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return LoginResult{}, ErrInvalidCredentials
	}

	return s.issueToken(user)
}

func (s *AuthService) issueToken(user dbgen.User) (LoginResult, error) {
	now := s.now().UTC()
	expiresAt := now.Add(s.jwtExpiresIn)
	token, err := signJWT(jwtClaims{
		Subject:     user.ID.String(),
		Email:       user.Email,
		DisplayName: user.DisplayName,
		IssuedAt:    now.Unix(),
		ExpiresAt:   expiresAt.Unix(),
	}, s.jwtSecret)
	if err != nil {
		return LoginResult{}, err
	}

	return LoginResult{
		AccessToken: token,
		ExpiresIn:   int(s.jwtExpiresIn.Seconds()),
		User:        user,
	}, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

type jwtClaims struct {
	Subject     string `json:"sub"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	IssuedAt    int64  `json:"iat"`
	ExpiresAt   int64  `json:"exp"`
}

func signJWT(claims jwtClaims, secret []byte) (string, error) {
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)
	encodedClaims := base64.RawURLEncoding.EncodeToString(claimsJSON)
	unsigned := encodedHeader + "." + encodedClaims

	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(unsigned))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return unsigned + "." + signature, nil
}
