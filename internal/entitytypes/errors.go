package entitytypes

import "errors"

var (
	// ErrInvalidArgument — невалидные параметры запроса (namespace/code, UUID и т.п.).
	ErrInvalidArgument = errors.New("invalid argument")
	// ErrDraftVersionConflict — несовпадение ожидаемой версии черновика (optimistic concurrency).
	ErrDraftVersionConflict = errors.New("draft schema version conflict")
	// ErrRevisionNotFound — ревизия не найдена для семейства в tenant.
	ErrRevisionNotFound = errors.New("entity type revision not found")
	// ErrFamilyNotDeletable — удаление семейства запрещено (есть сущности или опубликованные ревизии).
	ErrFamilyNotDeletable = errors.New("entity type family cannot be deleted")
	// ErrDuplicateFamilyKey — нарушение уникальности (tenant_id, namespace, code).
	ErrDuplicateFamilyKey = errors.New("entity type namespace and code already exist")
)
