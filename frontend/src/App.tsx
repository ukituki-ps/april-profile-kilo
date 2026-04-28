import { UIKit } from "@april/ui";
import {
  ConflictQueueWidget,
  EntityProfileWidget,
  InstanceHistoryWidget,
  ProfileInstancesWidget,
  ProfilesListWidget,
} from "@april/profile-ui";
import { Affix, Alert, Anchor, Box, Button, Container, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

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
        <Anchor component={Link} to="/profile-widget-demo">
          Открыть демо встраиваемого профиля
        </Anchor>
        <Anchor component={Link} to="/profiles-list-widget-demo">
          Открыть демо списка профилей
        </Anchor>
        <Anchor component={Link} to="/profile-instances-widget-demo">
          Открыть демо списка экземпляров профиля
        </Anchor>
        <Anchor component={Link} to="/instance-history-widget-demo">
          Открыть демо истории экземпляра
        </Anchor>
        <Anchor component={Link} to="/conflict-queue-widget-demo">
          Открыть демо очереди конфликтов и merge
        </Anchor>
        <Text c="dimmed">
          Замените этот экран маршрутизацией и экранами профиля. Стили и тема — из @april/ui
          (AprilProviders).
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

function ProfileWidgetDemoPage() {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const demoEntityId =
    import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID ?? "00000000-0000-0000-0000-000000000001";

  return (
    <Container py="xl" size="md">
      <Stack gap="md">
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Embedded demo for <code>@april/profile-ui</code> with `onSaveSuccess` callback.
        </Text>
        {saveMessage ? <Alert color="green">{saveMessage}</Alert> : null}
        <EntityProfileWidget
          hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req" } }}
          entityId={demoEntityId}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          onSaveSuccess={(payload) => {
            setSaveMessage(`Saved entity ${payload.entityId}, version ${payload.version}`);
          }}
        />
      </Stack>
    </Container>
  );
}

function ProfilesListWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const rawDemoEntityIds: string =
    import.meta.env.VITE_PROFILE_LIST_DEMO_ENTITY_IDS ??
    "00000000-0000-0000-0000-000000000001,00000000-0000-0000-0000-000000000002";
  const demoEntityIds = rawDemoEntityIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <Container py="xl" size="lg">
      <Stack gap="md">
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Profiles list widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Embedded demo for list/search/filter/pagination with CRUD actions.
        </Text>
        {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
        <ProfilesListWidget
          hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-list" } }}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          entityIds={demoEntityIds}
          onAction={(action) => {
            if (action.type === "deleted") {
              setActionMessage(`Deleted entity ${action.entityId}`);
              return;
            }
            setActionMessage(`${action.type} entity ${action.item.entityId}, version ${action.item.version}`);
          }}
        />
      </Stack>
    </Container>
  );
}

function ProfileInstancesWidgetDemoPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const profileId =
    import.meta.env.VITE_PROFILE_INSTANCES_DEMO_PROFILE_ID ?? "89ac9958-fec8-43d7-8908-f0438e8e0e39";
  const rawInstanceIds: string =
    import.meta.env.VITE_PROFILE_INSTANCES_DEMO_ENTITY_IDS ??
    "00000000-0000-0000-0000-000000000001,00000000-0000-0000-0000-000000000002";
  const instanceIds = rawInstanceIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <Container py="xl" size="lg">
      <Stack gap="md">
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Profile instances widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Embedded demo for instances list in selected profile context with CRUD actions and ABAC UX.
        </Text>
        {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
        <ProfileInstancesWidget
          hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-instances" } }}
          profileId={profileId}
          instanceIds={instanceIds}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
          onAction={(action) => {
            if (action.type === "deleted") {
              setActionMessage(`Deleted instance ${action.entityId}`);
              return;
            }
            setActionMessage(`${action.type} instance ${action.item.entityId}, version ${action.item.version}`);
          }}
          onOpenInstance={(entityId) => {
            setActionMessage(`Open instance ${entityId}`);
          }}
        />
      </Stack>
    </Container>
  );
}

function ConflictQueueWidgetDemoPage() {
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;

  return (
    <Container py="xl" size="lg">
      <Stack gap="md">
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Conflict queue widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Admin-only demo: authority conflict queue, manual resolve, and duplicate merge. Requires realm admin role on
          the API.
        </Text>
        <ConflictQueueWidget
          hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-conflicts" } }}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
        />
      </Stack>
    </Container>
  );
}

function InstanceHistoryWidgetDemoPage() {
  const apiBaseUrl = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  const accessToken = import.meta.env.VITE_PROFILE_ACCESS_TOKEN;
  const entityId =
    import.meta.env.VITE_PROFILE_HISTORY_DEMO_ENTITY_ID ?? "00000000-0000-0000-0000-000000000001";

  return (
    <Container py="xl" size="lg">
      <Stack gap="md">
        <Box style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Instance history widget demo</Text>
        </Box>
        <Text size="sm" c="dimmed">
          Embedded demo for version timeline and JSON diff in read-only history mode.
        </Text>
        <InstanceHistoryWidget
          hostContext={{ tenant: { id: "demo-tenant" }, telemetry: { requestId: "local-demo-req-history" } }}
          entityId={entityId}
          apiBaseUrl={apiBaseUrl}
          accessToken={accessToken}
        />
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
        <Route path="/profile-widget-demo" element={<ProfileWidgetDemoPage />} />
        <Route path="/profiles-list-widget-demo" element={<ProfilesListWidgetDemoPage />} />
        <Route path="/profile-instances-widget-demo" element={<ProfileInstancesWidgetDemoPage />} />
        <Route path="/instance-history-widget-demo" element={<InstanceHistoryWidgetDemoPage />} />
        <Route path="/conflict-queue-widget-demo" element={<ConflictQueueWidgetDemoPage />} />
      </Routes>
    </>
  );
}
