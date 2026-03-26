package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type Config struct {
	Audience string
	Issuer   string
	Secret   string
}

type Principal struct {
	CallerService string
	Scope         []string
	TokenType     string
}

type principalContextKey struct{}

type serviceClaims struct {
	Scope     []string `json:"scope"`
	TokenType string   `json:"tokenType"`
	jwt.RegisteredClaims
}

func RequireInternalServiceAuth(config Config, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearerTokenFromRequest(r)
		if token == "" {
			writeUnauthorized(w, "missing internal service token")
			return
		}

		claims := &serviceClaims{}
		parsedToken, err := jwt.ParseWithClaims(token, claims, func(parsedToken *jwt.Token) (any, error) {
			if parsedToken.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %s", parsedToken.Method.Alg())
			}

			return []byte(config.Secret), nil
		}, jwt.WithAudience(config.Audience), jwt.WithIssuer(config.Issuer))
		if err != nil || !parsedToken.Valid {
			writeUnauthorized(w, "invalid internal service token")
			return
		}

		if claims.TokenType != "service_access" {
			writeUnauthorized(w, "unexpected token type")
			return
		}

		ctx := context.WithValue(r.Context(), principalContextKey{}, Principal{
			CallerService: claims.Subject,
			Scope:         claims.Scope,
			TokenType:     claims.TokenType,
		})

		next(w, r.WithContext(ctx))
	}
}

func PrincipalFromContext(ctx context.Context) (Principal, bool) {
	principal, ok := ctx.Value(principalContextKey{}).(Principal)
	return principal, ok
}

func bearerTokenFromRequest(r *http.Request) string {
	authorizationHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authorizationHeader, "Bearer ") {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(authorizationHeader, "Bearer "))
}

func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": message,
		"status":  "error",
	})
}
