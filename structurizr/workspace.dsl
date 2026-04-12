workspace "April Service" "Каркас C4 (bootstrap); уточняйте по мере развития системы." {

    model {
        user = person "Пользователь" "Клиент веб-интерфейса April"
        admin = person "Администратор" "Операции и настройка стенда"

        april = softwareSystem "April Service" "REST API (Go), процессы Temporal, UI React; RBAC через Keycloak." {
            tags "April"
        }

        keycloak = softwareSystem "Keycloak" "IAM, роли и права (OIDC/OAuth2)." {
            tags "External"
        }

        user -> april "Использует через браузер"
        april -> keycloak "Проверка токенов / OIDC"
        admin -> april "Деплой, наблюдаемость, администрирование"
    }

    views {
        systemContext april "SystemContext" {
            include *
            autolayout lr
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
            element "External" {
                background #999999
                color #ffffff
            }
        }

        theme default
    }

    configuration {
        scope softwareSystem
    }
}
