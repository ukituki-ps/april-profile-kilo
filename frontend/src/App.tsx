import { Container, Stack, Text, Title } from "@mantine/core";

export default function App() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>April Profile</Title>
        <Text c="dimmed">
          Замените этот экран маршрутизацией и экранами профиля. Стили и тема — из @april/ui (AprilProviders).
        </Text>
      </Stack>
    </Container>
  );
}
