import { UIKit } from "@april/ui";
import { Anchor, Container, Group, Stack, Text, Title } from "@mantine/core";
import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>April Profile</Title>
        <Anchor component={Link} to="/showcase">
          Открыть страницу showcase
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
        <Group gap="md">
          <Anchor component={Link} to="/">
            April Profile
          </Anchor>
          <Text c="dimmed">/</Text>
          <Text>Showcase</Text>
        </Group>
      </Container>
      <UIKit />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/showcase" element={<ShowcasePage />} />
    </Routes>
  );
}
