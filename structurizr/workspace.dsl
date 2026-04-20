workspace "AprilProfile" "C4: сервис централизованных версионируемых профилей сущностей. Инварианты — docs/DESIGN_AprilProfile.md, ADR-0002/0003." {

    model {
        apiClient = person "Клиент API" "Внутренние сервисы April, BFF AprilHub, интеграции."
        admin = person "Администратор" "Эксплуатация, наблюдаемость, конфигурация."

        aprilProfile = softwareSystem "AprilProfile" "Централизованное версионируемое хранилище профилей сущностей (полиморфная модель, мультитенантность). REST, события об изменениях, маппинг и merge источников на стороне сервиса." {
            tags "April"

            app = container "Application" "Go, модульный монолит: REST API, обработчики очереди Asynq (синхронизация, идемпотентные батчи)." "Go"
            database = container "База данных" "Профили, версии, маппинг (tenant_id, source, external_id), метамодель типов." "PostgreSQL 17"
            queue = container "Очередь задач" "Фоновая синхронизация и фоновые сценарии." "Redis, Asynq"
        }

        keycloak = softwareSystem "Keycloak" "IAM: OIDC/OAuth2, RBAC; контекст tenant и ролей для ABAC поверх атрибутов профиля." {
            tags "External"
        }

        orgFlow = softwareSystem "AprilOrgFlow" "Оргструктура: граф, иерархии, матричные связи; мастер идентификаторов узлов и позиций." {
            tags "April"
        }

        externalSources = softwareSystem "Внешние источники данных" "HRIS, AD, CRM и др.; AprilProfile адаптирует и сливает данные по правилам authority." {
            tags "External"
        }

        eventConsumers = softwareSystem "Потребители событий" "Асинхронные подписчики на изменения профилей (доступы, зарплата, процессы, аналитика)." {
            tags "April"
        }

        apiClient -> aprilProfile "HTTPS: чтение и управление профилями, tenant из доверенного контекста"
        admin -> aprilProfile "Эксплуатация, наблюдаемость, конфигурация"

        aprilProfile -> keycloak "Проверка токенов, извлечение ролей и tenant"

        app -> keycloak "Проверка JWT, OIDC"
        app -> database "Хранение профилей и версий"
        app -> queue "Постановка и обработка задач синхронизации"
        app -> externalSources "Исходящие запросы адаптеров, импорт"
        app -> orgFlow "Согласованные org_node_id / position_id (без дублирования графа)"
        app -> eventConsumers "События об изменениях профилей (версия, event_id)"

        apiClient -> app "REST (контейнер приложения)"
    }

    views {
        systemContext aprilProfile "SystemContext" {
            include *
            autolayout lr
        }

        container aprilProfile "Containers" {
            include *
            autolayout tb
        }

        styles {
            element "Element" {
                color #1168bd
            }
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "April" {
                background #1168bd
                color #ffffff
            }
        }

        theme default
    }

    configuration {
        scope softwaresystem
    }
}
