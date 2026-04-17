import { Container, Stack, Text, Title } from "@mantine/core";

export default function App() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>April — прикладной shell</Title>
        <Text c="dimmed">
          Замените этот экран маршрутизацией и экранами сервиса. Стили и тема — из @april/ui (
          AprilProviders).
        </Text>
      </Stack>
    </Container>
  );
}
