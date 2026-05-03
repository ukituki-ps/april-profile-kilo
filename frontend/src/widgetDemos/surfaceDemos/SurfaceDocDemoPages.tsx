import {
  EntityTypesWidget,
  ProfilesWidget,
  ProfilesWidgetProfileDetail,
  type ProfilesWidgetProfileDetailHandle,
} from "@april/profile-ui";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Code,
  Container,
  Group,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useRef, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  DEMO_ENTITY_TYPES_HOST,
  DEMO_PROFILES_HOST,
  DEMO_PROFILES_SEED_LIST_ITEMS,
  DEMO_PROFILE_SEED_E1,
  profileWidgetDocUrl,
  useDemoApiEnv,
} from "../demoShared";

function SurfaceDocDemoChrome(props: {
  demoPath: string;
  docFile: string;
  surfaceTitle: string;
  /** Подсказка для составных демо (полный виджет + куда смотреть). Не используется, если задан `howToReadDemo`. */
  whereInUi?: string;
  /** Полная замена текста серого alert «Как читать это демо» (изолированная поверхность). */
  howToReadDemo?: ReactNode;
  children: ReactNode;
}) {
  const { apiBaseUrl, demoMock } = useDemoApiEnv();
  const docHref = profileWidgetDocUrl(props.docFile);

  return (
    <Container
      py="md"
      size="lg"
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Group gap="xs" wrap="wrap">
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Anchor component={Link} to="/widget-demos">
            Демо виджетов
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text fw={600}>Spec</Text>
          <Text c="dimmed">/</Text>
          <Code>{props.demoPath}</Code>
        </Group>
        <Title order={2}>{props.surfaceTitle}</Title>
        <Text size="sm">
          Карточка спеки:{" "}
          <Anchor href={docHref} target="_blank" rel="noreferrer">
            {props.docFile}
          </Anchor>{" "}
          (ветка <Code>develop</Code>).
        </Text>
        <Alert color="gray" title="Как читать это демо">
          {props.howToReadDemo ?? (
            <>
              Ниже тот же MSW и базовый URL, что на остальных демо при <Code>VITE_PROFILE_DEMO_MOCK=true</Code>.{" "}
              <strong>{props.whereInUi}</strong>
            </>
          )}
        </Alert>
        {demoMock ? (
          <Alert color="blue" title="MSW">
            Запросы к <Code>{apiBaseUrl}</Code> перехватываются моками из <Code>src/mocks/handlers.ts</Code>. Реальный
            API: <Code>VITE_PROFILE_DEMO_MOCK=false</Code>.
          </Alert>
        ) : null}
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{props.children}</Box>
      </Stack>
    </Container>
  );
}

function ProfilesSurfaceBody() {
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Stack gap="sm" style={{ height: "100%", minHeight: 0 }}>
      {msg ? (
        <Alert color="green" onClose={() => setMsg(null)} withCloseButton>
          {msg}
        </Alert>
      ) : null}
      <Box style={{ flex: 1, minHeight: 0 }}>
        <ProfilesWidget
          hostContext={DEMO_PROFILES_HOST}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          autoSelectFirst
          onAction={(action) => {
            if (action.type === "deleted") {
              setMsg(`deleted ${action.entityId}`);
              return;
            }
            setMsg(`${action.type} ${action.item.entityId}`);
          }}
        />
      </Box>
    </Stack>
  );
}

function ProfilesSurfaceDetailStandaloneBody() {
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const detailRef = useRef<ProfilesWidgetProfileDetailHandle>(null);
  const [readOnlyDetail, setReadOnlyDetail] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Stack gap="sm" style={{ height: "100%", minHeight: 0 }}>
      {msg ? (
        <Alert color="green" onClose={() => setMsg(null)} withCloseButton>
          {msg}
        </Alert>
      ) : null}
      <Group gap="md" wrap="wrap">
        <Button variant="light" onClick={() => detailRef.current?.openCreate()} data-testid="demo-profile-detail-open-create">
          Открыть создание (внешний вызов)
        </Button>
        <Button
          variant="default"
          size="compact-sm"
          onClick={() => setReadOnlyDetail((v) => !v)}
          aria-pressed={readOnlyDetail}
        >
          {readOnlyDetail ? "Включить редактирование" : "Read-only деталь"}
        </Button>
      </Group>
      <Box style={{ flex: 1, minHeight: 0 }}>
        <ProfilesWidgetProfileDetail
          ref={detailRef}
          hostContext={DEMO_PROFILES_HOST}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          entityId={DEMO_PROFILE_SEED_E1}
          listItem={DEMO_PROFILES_SEED_LIST_ITEMS[0]}
          listItemsForDuplicateCheck={DEMO_PROFILES_SEED_LIST_ITEMS}
          documentEditingEnabled={!readOnlyDetail}
          allowProfileDelete={!readOnlyDetail}
          onAction={(action) => {
            if (action.type === "deleted") {
              setMsg(`deleted ${action.entityId}`);
              return;
            }
            setMsg(`${action.type} ${action.item.entityId}`);
          }}
        />
      </Box>
    </Stack>
  );
}

function EntityTypesSurfaceBody() {
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Stack gap="sm" style={{ height: "100%", minHeight: 0 }}>
      {msg ? (
        <Alert color="green" onClose={() => setMsg(null)} withCloseButton>
          {msg}
        </Alert>
      ) : null}
      <Box style={{ flex: 1, minHeight: 0 }}>
        <EntityTypesWidget
          hostContext={DEMO_ENTITY_TYPES_HOST}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          onAction={(a) => setMsg(a.type)}
        />
      </Box>
    </Stack>
  );
}

export function ProfilesWidgetAssemblySurfaceDemoPage() {
  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/profiles-widget"
      docFile="profiles-widget.md"
      surfaceTitle="profiles-widget — сборка (список + деталь)"
      whereInUi="Слева список (`CardListColumn`), справа карточка и документ; кнопка «добавить» в списке открывает создание профиля (модалка виджета детали)."
    >
      <ProfilesSurfaceBody />
    </SurfaceDocDemoChrome>
  );
}

/** Редирект со старого маршрута спеки-only списка на сборку `profiles-widget.md`. */
export function ProfilesWidgetListSurfaceRedirectPage() {
  return <Navigate to="/demo/surfaces/profiles-widget" replace />;
}

export function ProfilesWidgetProfileDetailSurfaceDemoPage() {
  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/profiles-widget-profile-detail"
      docFile="profiles-widget-profile-detail.md"
      surfaceTitle="profiles-widget-profile-detail (npm)"
      howToReadDemo={
        <Text size="sm">
          Ниже самостоятельный виджет <Code>ProfilesWidgetProfileDetail</Code>: карточка выбранной сущности и модалка создания.
          Кнопка «Открыть создание» демонстрирует <strong>внешний</strong> вызов <Code>ref.openCreate()</Code> (часть 2 не
          привязана только к UI карточки). Переключатель read-only отключает редактирование/удаление части 1. Сид списка
          совпадает с MSW в <Code>handlers.ts</Code>.
        </Text>
      }
    >
      <ProfilesSurfaceDetailStandaloneBody />
    </SurfaceDocDemoChrome>
  );
}

export function EntityTypesWidgetCatalogListSurfaceDemoPage() {
  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/entity-types-widget-catalog-list"
      docFile="entity-types-widget-catalog-list.md"
      surfaceTitle="entity-types-widget — каталог (список семейств)"
      whereInUi="Смотрите левую колонку: семейства типов (`namespace/code`), выбор строки."
    >
      <EntityTypesSurfaceBody />
    </SurfaceDocDemoChrome>
  );
}

export function EntityTypesWidgetSchemaAdminSurfaceDemoPage() {
  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/entity-types-widget-schema-admin"
      docFile="entity-types-widget-schema-admin.md"
      surfaceTitle="entity-types-widget — схема, черновик, ревизии"
      whereInUi="После выбора семейства — панель черновика, вкладки Draft / Revisions, публикация, JSON-редакторы DS."
    >
      <EntityTypesSurfaceBody />
    </SurfaceDocDemoChrome>
  );
}

export function EntityTypesWidgetEntitiesUpgradeSurfaceDemoPage() {
  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/entity-types-widget-entities-upgrade"
      docFile="entity-types-widget-entities-upgrade.md"
      surfaceTitle="entity-types-widget — Entities / Upgrade"
      whereInUi="Выберите семейство → вкладка «сущности / апгрейд»: таблица, `GET /v1/entities`, batch/single, `onOpenEntity`."
    >
      <EntityTypesSurfaceBody />
    </SurfaceDocDemoChrome>
  );
}

export function EntityTypesWidgetIntegrationSurfaceDemoPage() {
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const [tabMsg, setTabMsg] = useState<string | null>(null);

  return (
    <SurfaceDocDemoChrome
      demoPath="/demo/surfaces/entity-types-widget-integration"
      docFile="entity-types-widget-integration.md"
      surfaceTitle="entity-types-widget — интеграция (host, props)"
      whereInUi="Вкладки: живые виджеты для проверки props/callbacks; отдельно — выжимка таблицы из спеки."
    >
      <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Tabs
          defaultValue="props"
          keepMounted={false}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Tabs.List>
            <Tabs.Tab value="props">Таблица props</Tabs.Tab>
            <Tabs.Tab value="entity">EntityTypesWidget</Tabs.Tab>
            <Tabs.Tab value="profiles">ProfilesWidget</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="props" pt="md" style={{ flex: 1, minHeight: 0 }}>
            <ScrollArea h="100%" type="auto">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  См. типы <Code>EntityTypesWidgetProps</Code> в пакете; ниже — краткая сводка как в спеке.
                </Text>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Prop</Table.Th>
                      <Table.Th>Обяз.</Table.Th>
                      <Table.Th>Описание</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Code>hostContext</Code>
                      </Table.Td>
                      <Table.Td>да</Table.Td>
                      <Table.Td>tenant, telemetry, опционально auth</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>apiBaseUrl</Code>
                      </Table.Td>
                      <Table.Td>да</Table.Td>
                      <Table.Td>База Profile API / BFF</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>accessToken</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>Bearer для SDK</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>pageSize</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>Лимит списка на вкладке Upgrade (по умолчанию 20)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>providerContext</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>Переопределение контекста без AbortSignal (тесты)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>onAction</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>
                        <Code>EntityTypesWidgetAction</Code>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>onError</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>Безопасное сообщение + requestId</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>onObservability</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>
                        <Code>widget: entity_types</Code>, list/draft/upgrade/…
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Code>onOpenEntity</Code>
                      </Table.Td>
                      <Table.Td>нет</Table.Td>
                      <Table.Td>Навигация к профилю по entity id</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Stack>
            </ScrollArea>
          </Tabs.Panel>
          <Tabs.Panel value="entity" pt="md" style={{ flex: 1, minHeight: 0 }}>
            <Stack gap="sm" style={{ height: "100%", minHeight: 0 }}>
              {tabMsg ? (
                <Alert color="green" onClose={() => setTabMsg(null)} withCloseButton>
                  {tabMsg}
                </Alert>
              ) : null}
              <Box style={{ flex: 1, minHeight: 0 }}>
                <EntityTypesWidget
                  hostContext={DEMO_ENTITY_TYPES_HOST}
                  apiBaseUrl={apiBaseUrl}
                  accessToken={accessToken}
                  onAction={(a) => setTabMsg(a.type)}
                />
              </Box>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="profiles" pt="md" style={{ flex: 1, minHeight: 0 }}>
            <ProfilesSurfaceBody />
          </Tabs.Panel>
        </Tabs>
      </Box>
    </SurfaceDocDemoChrome>
  );
}
