import { UIKit } from "@april/ui";
import { Affix, Anchor, Box, Button, Container, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import { Link, Route, Routes } from "react-router-dom";
import {
  EntityTypesApiWidgetDemoPage,
  EntityTypesWidgetCoreDemoPage,
  EntityTypesWidgetDemoPage,
  ProfilesApiWidgetDemoPage,
  ProfilesWidgetCoreDemoPage,
  ProfilesWidgetDemoPage,
  WidgetDemosIndexPage,
} from "./widgetDemos/WidgetDemoPages";
import {
  EntityTypesWidgetCatalogListSurfaceDemoPage,
  EntityTypesWidgetEntitiesUpgradeSurfaceDemoPage,
  EntityTypesWidgetIntegrationSurfaceDemoPage,
  EntityTypesWidgetSchemaAdminSurfaceDemoPage,
  ProfilesWidgetListSurfaceDemoPage,
  ProfilesWidgetProfileDetailSurfaceDemoPage,
} from "./widgetDemos/surfaceDemos/SurfaceDocDemoPages";

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
        <Anchor component={Link} to="/widget-demos">
          Все демо виджетов с MSW (`@april/profile-ui`)
        </Anchor>
        <Anchor component={Link} to="/showcase">
          Открыть страницу showcase
        </Anchor>
        <Anchor component={Link} to="/profiles-widget-demo">
          Демо списка профилей (`ProfilesWidget`)
        </Anchor>
        <Anchor component={Link} to="/entity-types-widget-demo">
          Демо каталога типов (`EntityTypesWidget`)
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

export default function App() {
  return (
    <>
      <ColorSchemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/widget-demos" element={<WidgetDemosIndexPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/profiles-widget-demo" element={<ProfilesWidgetDemoPage />} />
        <Route path="/entity-types-widget-demo" element={<EntityTypesWidgetDemoPage />} />
        <Route path="/profiles-api-widget-demo" element={<ProfilesApiWidgetDemoPage />} />
        <Route path="/entity-types-api-widget-demo" element={<EntityTypesApiWidgetDemoPage />} />
        <Route path="/profiles-widget-core-demo" element={<ProfilesWidgetCoreDemoPage />} />
        <Route path="/entity-types-widget-core-demo" element={<EntityTypesWidgetCoreDemoPage />} />
        <Route path="/demo/surfaces/profiles-widget-list" element={<ProfilesWidgetListSurfaceDemoPage />} />
        <Route
          path="/demo/surfaces/profiles-widget-profile-detail"
          element={<ProfilesWidgetProfileDetailSurfaceDemoPage />}
        />
        <Route
          path="/demo/surfaces/entity-types-widget-catalog-list"
          element={<EntityTypesWidgetCatalogListSurfaceDemoPage />}
        />
        <Route
          path="/demo/surfaces/entity-types-widget-schema-admin"
          element={<EntityTypesWidgetSchemaAdminSurfaceDemoPage />}
        />
        <Route
          path="/demo/surfaces/entity-types-widget-entities-upgrade"
          element={<EntityTypesWidgetEntitiesUpgradeSurfaceDemoPage />}
        />
        <Route
          path="/demo/surfaces/entity-types-widget-integration"
          element={<EntityTypesWidgetIntegrationSurfaceDemoPage />}
        />
      </Routes>
    </>
  );
}
