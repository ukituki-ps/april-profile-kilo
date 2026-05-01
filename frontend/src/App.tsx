import { UIKit } from "@april/ui";
import { EntityTypesWidget, ProfilesWidget } from "@april/profile-ui";
import { Affix, Alert, Anchor, Box, Button, Container, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { isDemoMswEnabled } from "./mocks/demoEnv";

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Affix position={{ top: 16, right: 16 }}>
      <Button
        size="xs"
        variant="light"
        onClick={() => {
          setColorScheme(colorScheme === "dark" ? "light" : "dark");
        }}
      >
        {colorScheme === "dark" ? "Light theme" : "Dark theme"}
      </Button>
    </Affix>
  );
}

function HomePage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>April Profile</Title>
        <Anchor component={Link} to="/showcase">
          Открыть страницу showcase
        </Anchor>
        <Anchor component={Link} to="/profiles-widget-demo">
          Демо списка профилей (`profiles-widget`)
        </Anchor>
        <Anchor component={Link} to="/entity-types-widget-demo">
          Демо каталога типов (`entity-types-widget`)
        </Anchor>
        <Text c="dimmed">
          Замените этот экран маршрутизацией и экранами профиля. Стили и тема — из @april/ui (AprilProviders).
        </Text>
      </Stack>
    </Container>
  );
}

function ShowcasePage() {
  return (
    <>
      <Container py="md" size="lg">
        <Box style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Showcase</Text>
        </Box>
      </Container>
      <UIKit />
    </>
  );
}

function ProfilesWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const demoMock = isDemoMswEnabled();

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
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Profiles widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Демо `ProfilesWidget`: список, поиск, фильтры, пагинация, CRUD.
        </Text>
        {demoMock ? (
          <Alert color="blue" title="Локальные примеры данных">
            Запросы к <Text span fw={600} component="span">{apiBaseUrl}</Text> в dev перехватываются MSW. Чтобы ходить на
            настоящий сервис по этому URL, задайте <Text span component="span" ff="monospace">VITE_PROFILE_DEMO_MOCK=false</Text>.
          </Alert>
        ) : null}
        {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <ProfilesWidget
            hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-list" } }}
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
        </Box>
      </Stack>
    </Container>
  );
}

function EntityTypesWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const demoMock = isDemoMswEnabled();

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
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Entity types widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Демо `EntityTypesWidget`: семейства типов, черновики, ревизии, апгрейд привязки.
        </Text>
        {demoMock ? (
          <Alert color="blue" title="Локальные примеры данных">
            Запросы к <Text span fw={600} component="span">{apiBaseUrl}</Text> в dev перехватываются MSW. Чтобы ходить на
            настоящий сервис по этому URL, задайте <Text span component="span" ff="monospace">VITE_PROFILE_DEMO_MOCK=false</Text>.
          </Alert>
        ) : null}
        {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <EntityTypesWidget
            hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-entity-types" } }}
            apiBaseUrl={apiBaseUrl}
            accessToken={accessToken}
            onAction={(action) => {
              setActionMessage(`${action.type}`);
            }}
          />
        </Box>
      </Stack>
    </Container>
  );
}

export default function App() {
  return (
    <>
      <ColorSchemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/profiles-widget-demo" element={<ProfilesWidgetDemoPage />} />
        <Route path="/entity-types-widget-demo" element={<EntityTypesWidgetDemoPage />} />
      </Routes>
    </>
  );
}
