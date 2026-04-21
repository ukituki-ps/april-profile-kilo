# Keycloak на стенде: координаты для интеграции (задача 005 и smoke)

Документ для **ручной проверки** и настройки env: живой Keycloak на внутреннем/стендовом хосте. Значения **не коммитьте** с реальными секретами; в репозитории — только примеры и плейсхолдеры.

Связано: [`auth-jwt-keycloak-adapted.md`](./auth-jwt-keycloak-adapted.md), задача [`tasks/005-phase-1-keycloak-jwt-tenant-context`](../tasks/005-phase-1-keycloak-jwt-tenant-context/TASK.md).

---

## 1. Минимум координат

Нужна **одна строка**, из которой однозначно собирается база Keycloak (схема, хост, порт, префикс пути):

- **`<BASE>`** — URL до Keycloak **без** хвоста `/realms/...`. Часто включает префикс `/auth` (зависит от версии Keycloak и reverse proxy).

**Пример (замените на фактический хост и порт вашего стенда):**

```text
http://192.168.1.42:8080/auth
```

Порт и наличие `/auth` у вас могут отличаться — берите **фактические** с Admin Console или с того URL, по которому браузер открывает Keycloak.

Дальше все пути ниже строятся от **`<BASE>`** и **`<realm>`** (имя realm в Keycloak; в документации экосистемы часто используется `april` — на вашем стенде может быть другое).

---

## 2. Обязательные URL для проверки и интеграции

Подставьте свой `<BASE>` и `<realm>`.

| Назначение | URL |
|------------|-----|
| **OpenID Discovery** | `<BASE>/realms/<realm>/.well-known/openid-configuration` |
| **Authorization** | из discovery: поле `authorization_endpoint` |
| **Token** | из discovery: поле `token_endpoint` |
| **JWKS (backend)** | `<BASE>/realms/<realm>/protocol/openid-connect/certs` |
| **Logout (если нужен)** | обычно из discovery: `end_session_endpoint` |

**Первый шаг:** открыть в браузере или через `curl` **discovery** — там будут точные endpoints без угадывания.

Пример (иллюстративный):

```text
http://192.168.1.42:8080/auth/realms/april/.well-known/openid-configuration
```

---

## 3. Backend микросервиса (валидация JWT)

- **JWKS URL** — как в таблице выше (тот же хост/порт/путь, с которого Keycloak реально отдаёт ключи). Если контейнер приложения в другой сети, он должен **достучаться** до хоста Keycloak (маршрут, firewall, `host.docker.internal` / IP хоста — по среде).

- **Issuer (`iss` в токене)** — должен **совпадать** с тем, что Keycloak кладёт в JWT. Обычно это:

  ```text
  <BASE>/realms/<realm>
  ```

  (с тем же схемой/хостом/портом/путём, что и публичный вход в Keycloak.)

  **Не подставляйте «красивый» домен**, если токен выписан с `iss` на IP — проверка упадёт.

  **Практика:** взять один выданный access token, декодировать payload (**только для отладки**), скопировать поле `iss` — его и зафиксировать в `KEYCLOAK_ISSUER` (или аналоге).

- **Audience / client** — проверять `aud` и/или `azp` так же, как настроен OIDC client в Keycloak (должно совпадать с документацией клиента).

**Переменные окружения (ориентир для экосистемы):**

| Переменная | Назначение |
|------------|------------|
| `KEYCLOAK_JWKS_URL` | полный URL JWKS (см. выше) |
| `KEYCLOAK_ISSUER` | ровно `iss` из валидного access token |
| `KEYCLOAK_AUDIENCE` | ожидаемая аудитория (или согласованная проверка `azp`) |

При необходимости отдельно задаётся имя realm, если библиотека не выводит issuer сама.

См. также [`.env.example`](../.env.example).

---

## 4. Браузерное приложение (OIDC + PKCE)

В Keycloak для **public client** указать:

- **Valid redirect URIs** — реальные URL вашего UI, например `http://192.168.1.42:3000/*` или `http://localhost:5173/*` (всё, что реально используете).
- **Web origins** — соответствующие **origins без пути**, например `http://192.168.1.42:3000`.

В коде фронта **base URL Keycloak** = ваш **`<BASE>`** (тот же, что открывается в браузере).

---

## 5. Частые сбои

- **Разный host в токене и в конфиге:** пользователь открывает Keycloak по `http://192.168.1.42`, а в `iss` попал `localhost` или другой hostname — issuer не совпадёт. Нужна **единая точка входа** на Keycloak (hostname/port/path), согласованная с `KC_HOSTNAME` / proxy.

- **HTTPS страница + HTTP Keycloak:** mixed content или предупреждения браузера; для прод обычно единый уровень TLS на ingress.

- **Доступ с другой машины:** клиент должен резолвить и открывать IP/хост Keycloak; без маршрута до подсети — VPN или публичный DNS.

- **Docker:** микросервис на той же машине может ходить к хосту как `host.docker.internal` или IP хоста, но **`iss` в токене** всё равно должен совпадать с тем URL, которым Keycloak «считает себя» публично.

---

## 6. Краткий чеклист «подключился / нет»

1. Открывается **discovery**:  
   `<BASE>/realms/<realm>/.well-known/openid-configuration`
2. Получаете токен (authorization code + PKCE или client credentials).
3. В JWT поле **`iss`** ровно то, что в конфиге backend (`KEYCLOAK_ISSUER`).
4. Запрос к API с `Authorization: Bearer` проходит; без токена — **401**.

**Итого:** достаточно зафиксировать **`<BASE>`** (например `http://<host>:<port>/auth`) и **`<realm>`**, плюс настройка клиента в Keycloak под URL вашего UI и API; полная карта URL — из **OpenID Discovery**.

Если известны точные `<BASE>` и `<realm>` с вашего стенда, подставьте их в `.env` локально и перечислите в отчёте задачи 005 (без секретов в git).
