import {
  EntityTypesApiWidget,
  EntityTypesWidget,
  EntityTypesWidgetCore,
  ProfilesApiWidget,
  ProfilesWidget,
  ProfilesWidgetCore,
} from "@april/profile-ui";
import {
  Alert,
  Anchor,
  Box,
  Code,
  Container,
  Divider,
  Group,
  NavLink,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DEMO_ENTITY_TYPES_HOST, DEMO_PROFILES_HOST, useDemoApiEnv } from "./demoShared";
import { useOpenApiEntityTypesEmbed, useOpenApiProfilesEmbed } from "./openApiEmbedWiring";

function WidgetDemoChrome(props: {
  title: string;
  description: string;
  mswHint?: string;
  actionMessage: string | null;
  children: ReactNode;
}) {
  const { apiBaseUrl, demoMock } = useDemoApiEnv();
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
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Anchor component={Link} to="/widget-demos">
            Демо виджетов
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>{props.title}</Text>
        </Box>
        <Text size="sm" c="dimmed">
          {props.description}
        </Text>
        {props.mswHint && demoMock ? (
          <Alert color="blue" title="Локальные примеры данных">
            {props.mswHint}{" "}
            <Text span fw={600} component="span">
              {apiBaseUrl}
            </Text>{" "}
            в dev перехватываются MSW. Для настоящего API:{" "}
            <Text span component="span" ff="monospace">
              VITE_PROFILE_DEMO_MOCK=false
            </Text>
            .
          </Alert>
        ) : null}
        {props.actionMessage ? <Alert color="green">{props.actionMessage}</Alert> : null}
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{props.children}</Box>
      </Stack>
    </Container>
  );
}

function DemoRouteNavLink(props: { to: string; title: string; description: string }) {
  return (
    <NavLink
      component={Link}
      to={props.to}
      label={
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Text fw={600} component="span">
            {props.title}
          </Text>
          <Code fz="sm">{props.to}</Code>
        </Group>
      }
      description={props.description}
    />
  );
}

function DemoSection(props: { title: string; children: ReactNode }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Title order={4}>{props.title}</Title>
        <Divider />
        {props.children}
      </Stack>
    </Paper>
  );
}

export function WidgetDemosIndexPage() {
  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Box>
          <Title order={1}>Демо `@april/profile-ui`</Title>
          <Text c="dimmed" size="sm" mt="xs">
            В dev с <Code>VITE_PROFILE_DEMO_MOCK=true</Code> (или по умолчанию) все маршруты ниже ходят в один и тот
            же MSW к <Code>VITE_PROFILE_API_BASE_URL</Code> (по умолчанию <Code>/admin/profile/api</Code>). У каждого
            пункта — <strong>свой путь</strong> в колонке справа от названия.
          </Text>
        </Box>

        <DemoSection title="Фасады (готовый embed)">
          <DemoRouteNavLink
            to="/profiles-widget-demo"
            title="ProfilesWidget"
            description="Список сущностей, карточка профиля, версии документа, CRUD."
          />
          <DemoRouteNavLink
            to="/entity-types-widget-demo"
            title="EntityTypesWidget"
            description="Каталог семейств типов, черновик схемы, ревизии, вкладка Upgrade."
          />
        </DemoSection>

        <DemoSection title="Api-слой (тот же OpenAPI, другой экспорт пакета)">
          <DemoRouteNavLink
            to="/profiles-api-widget-demo"
            title="ProfilesApiWidget"
            description="Провайдер и контекст как у фасада; для проверки импорта ApiWidget в host."
          />
          <DemoRouteNavLink
            to="/entity-types-api-widget-demo"
            title="EntityTypesApiWidget"
            description="Аналогично для каталога типов."
          />
        </DemoSection>

        <DemoSection title="WidgetCore + провайдер (ручной wiring)">
          <DemoRouteNavLink
            to="/profiles-widget-core-demo"
            title="ProfilesWidgetCore"
            description="Явный createOpenApiProfilesProvider + providerContext (см. widgetDemos/openApiEmbedWiring.ts)."
          />
          <DemoRouteNavLink
            to="/entity-types-widget-core-demo"
            title="EntityTypesWidgetCore"
            description="Явный createOpenApiEntityTypesProvider + providerContext."
          />
        </DemoSection>

        <DemoSection title="Спеки по поверхностям (markdown + тот же MSW)">
          <Text size="sm" c="dimmed">
            Отдельный маршрут на каждый файл в <Code>docs/widgets/profile/</Code>: полный виджет + подсказка, какая
            часть UI относится к спеке (отдельных npm-компонентов на поверхность пока нет).
          </Text>
          <DemoRouteNavLink
            to="/demo/surfaces/profiles-widget-list"
            title="profiles-widget-list"
            description="Список профилей (левая колонка)."
          />
          <DemoRouteNavLink
            to="/demo/surfaces/profiles-widget-profile-detail"
            title="profiles-widget-profile-detail"
            description="Карточка и документ (правая колонка)."
          />
          <DemoRouteNavLink
            to="/demo/surfaces/entity-types-widget-catalog-list"
            title="entity-types-widget-catalog-list"
            description="Каталог семейств типов."
          />
          <DemoRouteNavLink
            to="/demo/surfaces/entity-types-widget-schema-admin"
            title="entity-types-widget-schema-admin"
            description="Черновик, ревизии, публикация."
          />
          <DemoRouteNavLink
            to="/demo/surfaces/entity-types-widget-entities-upgrade"
            title="entity-types-widget-entities-upgrade"
            description="Вкладка Upgrade."
          />
          <DemoRouteNavLink
            to="/demo/surfaces/entity-types-widget-integration"
            title="entity-types-widget-integration"
            description="Props / вкладки с живыми виджетами."
          />
        </DemoSection>

        <DemoSection title="Прочее">
          <DemoRouteNavLink to="/showcase" title="UIKit showcase" description="Примитивы дизайн-системы `@april/ui`." />
          <NavLink
            component={Link}
            to="/"
            label={
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Text fw={600} component="span">
                  Главная shell
                </Text>
                <Code fz="sm">/</Code>
              </Group>
            }
            description="Корень Vite-приложения, ссылки на демо."
          />
        </DemoSection>
      </Stack>
    </Container>
  );
}

export function ProfilesWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();

  return (
    <WidgetDemoChrome
      title="ProfilesWidget"
      description="Демо `ProfilesWidget`: список, поиск, фильтры, пагинация, CRUD."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <ProfilesWidget
        hostContext={DEMO_PROFILES_HOST}
        apiBaseUrl={apiBaseUrl}
        accessToken={accessToken}
        autoSelectFirst
        onAction={(action) => {
          if (action.type === "deleted") {
            setActionMessage(`Deleted entity ${action.entityId}`);
            return;
          }
          setActionMessage(`${action.type} entity ${action.item.entityId}, version ${action.item.version}`);
        }}
      />
    </WidgetDemoChrome>
  );
}

export function EntityTypesWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();

  return (
    <WidgetDemoChrome
      title="EntityTypesWidget"
      description="Демо `EntityTypesWidget`: семейства типов, черновики, ревизии, апгрейд привязки."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <EntityTypesWidget
        hostContext={DEMO_ENTITY_TYPES_HOST}
        apiBaseUrl={apiBaseUrl}
        accessToken={accessToken}
        onAction={(action) => {
          setActionMessage(`${action.type}`);
        }}
      />
    </WidgetDemoChrome>
  );
}

export function ProfilesApiWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();

  return (
    <WidgetDemoChrome
      title="ProfilesApiWidget"
      description="Тот же UX, что у `ProfilesWidget`: фасад только прокидывает props в Api-слой. Полезно проверить встраивание по экспорту `ProfilesApiWidget`."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <ProfilesApiWidget
        hostContext={DEMO_PROFILES_HOST}
        apiBaseUrl={apiBaseUrl}
        accessToken={accessToken}
        autoSelectFirst
        onAction={(action) => {
          if (action.type === "deleted") {
            setActionMessage(`Deleted entity ${action.entityId}`);
            return;
          }
          setActionMessage(`${action.type} entity ${action.item.entityId}, version ${action.item.version}`);
        }}
      />
    </WidgetDemoChrome>
  );
}

export function EntityTypesApiWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();

  return (
    <WidgetDemoChrome
      title="EntityTypesApiWidget"
      description="Тот же UX, что у `EntityTypesWidget`, через экспорт `EntityTypesApiWidget`."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <EntityTypesApiWidget
        hostContext={DEMO_ENTITY_TYPES_HOST}
        apiBaseUrl={apiBaseUrl}
        accessToken={accessToken}
        onAction={(action) => {
          setActionMessage(`${action.type}`);
        }}
      />
    </WidgetDemoChrome>
  );
}

export function ProfilesWidgetCoreDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const { provider, providerContext } = useOpenApiProfilesEmbed(apiBaseUrl, accessToken, DEMO_PROFILES_HOST);

  return (
    <WidgetDemoChrome
      title="ProfilesWidgetCore"
      description="`ProfilesWidgetCore` с `createOpenApiProfilesProvider` и `providerContext` (см. `frontend/src/widgetDemos/openApiEmbedWiring.ts`, синхронно с `ProfilesApiWidget`)."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <ProfilesWidgetCore
        hostContext={DEMO_PROFILES_HOST}
        provider={provider}
        providerContext={providerContext}
        autoSelectFirst
        onAction={(action) => {
          if (action.type === "deleted") {
            setActionMessage(`Deleted entity ${action.entityId}`);
            return;
          }
          setActionMessage(`${action.type} entity ${action.item.entityId}, version ${action.item.version}`);
        }}
      />
    </WidgetDemoChrome>
  );
}

export function EntityTypesWidgetCoreDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { apiBaseUrl, accessToken } = useDemoApiEnv();
  const { provider, providerContext } = useOpenApiEntityTypesEmbed(apiBaseUrl, accessToken, DEMO_ENTITY_TYPES_HOST);

  return (
    <WidgetDemoChrome
      title="EntityTypesWidgetCore"
      description="`EntityTypesWidgetCore` с `createOpenApiEntityTypesProvider` (см. `openApiEmbedWiring.ts`, синхронно с `EntityTypesApiWidget`)."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <EntityTypesWidgetCore
        hostContext={DEMO_ENTITY_TYPES_HOST}
        provider={provider}
        providerContext={providerContext}
        onAction={(action) => {
          setActionMessage(`${action.type}`);
        }}
      />
    </WidgetDemoChrome>
  );
}
