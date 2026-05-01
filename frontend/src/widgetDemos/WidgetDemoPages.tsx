import {
  EntityTypesApiWidget,
  EntityTypesWidget,
  EntityTypesWidgetCore,
  ProfilesApiWidget,
  ProfilesWidget,
  ProfilesWidgetCore,
} from "@april/profile-ui";
import type { ProfileWidgetHostContext } from "@april/profile-ui";
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
import { isDemoMswEnabled } from "../mocks/demoEnv";
import { useOpenApiEntityTypesEmbed, useOpenApiProfilesEmbed } from "./openApiEmbedWiring";

function useDemoApiEnv() {
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const demoMock = isDemoMswEnabled();
  return { apiBaseUrl, accessToken, demoMock };
}

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

const profilesHost: ProfileWidgetHostContext = {
  tenant: { id: "demo-tenant" },
  telemetry: { requestId: "local-demo-req-list" },
};

const entityTypesHost: ProfileWidgetHostContext = {
  tenant: { id: "demo-tenant" },
  telemetry: { requestId: "local-demo-req-entity-types" },
};

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
        hostContext={profilesHost}
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
        hostContext={entityTypesHost}
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
        hostContext={profilesHost}
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
        hostContext={entityTypesHost}
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
  const { provider, providerContext } = useOpenApiProfilesEmbed(apiBaseUrl, accessToken, profilesHost);

  return (
    <WidgetDemoChrome
      title="ProfilesWidgetCore"
      description="`ProfilesWidgetCore` с `createOpenApiProfilesProvider` и `providerContext` (см. `frontend/src/widgetDemos/openApiEmbedWiring.ts`, синхронно с `ProfilesApiWidget`)."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <ProfilesWidgetCore
        hostContext={profilesHost}
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
  const { provider, providerContext } = useOpenApiEntityTypesEmbed(apiBaseUrl, accessToken, entityTypesHost);

  return (
    <WidgetDemoChrome
      title="EntityTypesWidgetCore"
      description="`EntityTypesWidgetCore` с `createOpenApiEntityTypesProvider` (см. `openApiEmbedWiring.ts`, синхронно с `EntityTypesApiWidget`)."
      mswHint="Запросы к"
      actionMessage={actionMessage}
    >
      <EntityTypesWidgetCore
        hostContext={entityTypesHost}
        provider={provider}
        providerContext={providerContext}
        onAction={(action) => {
          setActionMessage(`${action.type}`);
        }}
      />
    </WidgetDemoChrome>
  );
}
