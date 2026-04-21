package asyncjobs

import "context"

// Publisher — доставка события профиля внешним потребителям (заглушка до интеграций).
// Обработчик батча вызывает Publish для каждой строки outbox с учётом tenant_id.
type Publisher interface {
	PublishProfileChange(ctx context.Context, tenantID string, payload []byte) error
}

// StubPublisher не выполняет внешних вызовов; успех означает «можно пометить published в БД».
type StubPublisher struct{}

func (StubPublisher) PublishProfileChange(_ context.Context, _ string, _ []byte) error {
	return nil
}
