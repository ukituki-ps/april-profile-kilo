import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Group, Loader, Stack, Text, Textarea, Title } from "@mantine/core";
import { OpenAPI, ProfilesService } from "../generated";
import type { SaveSuccessPayload, ProfileWidgetHostContext } from "../types";

export type EntityProfileWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  entityId: string;
  apiBaseUrl: string;
  accessToken?: string;
  onSaveSuccess?: (payload: SaveSuccessPayload) => void;
  onError?: (payload: { message: string; requestId?: string }) => void;
};

type ProfileSnapshot = Awaited<ReturnType<typeof ProfilesService.getEntityCurrentProfile>>;

const prettyJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 2);

const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected profile API error";
};

export function EntityProfileWidget({
  hostContext,
  entityId,
  apiBaseUrl,
  accessToken,
  onSaveSuccess,
  onError,
}: EntityProfileWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [editorValue, setEditorValue] = useState("{}");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestId = hostContext.telemetry?.requestId;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage(null);
      OpenAPI.BASE = apiBaseUrl;
      OpenAPI.TOKEN = accessToken;

      try {
        const snapshot = await ProfilesService.getEntityCurrentProfile(entityId);
        if (cancelled) {
          return;
        }
        setProfile(snapshot);
        setEditorValue(prettyJson(snapshot.document));
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = parseErrorMessage(error);
        setErrorMessage(message);
        onError?.({ message, requestId });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, entityId, onError, requestId]);

  const canSave = useMemo(() => !loading && !saving && profile !== null, [loading, saving, profile]);

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    setErrorMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(editorValue);
    } catch {
      const message = "Document must be valid JSON";
      setErrorMessage(message);
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      const message = "Document must be a JSON object";
      setErrorMessage(message);
      return;
    }

    setSaving(true);
    OpenAPI.BASE = apiBaseUrl;
    OpenAPI.TOKEN = accessToken;

    try {
      const saved = await ProfilesService.updateEntityProfile(entityId, {
        document: parsed as Record<string, unknown>,
      });
      setProfile(saved);
      setEditorValue(prettyJson(saved.document));
      onSaveSuccess?.({ entityId: saved.entity_id, version: saved.version });
    } catch (error) {
      const message = parseErrorMessage(error);
      setErrorMessage(message);
      onError?.({ message, requestId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Group aria-label="profile-widget-loading">
        <Loader size="sm" />
        <Text size="sm">Loading profile…</Text>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Entity profile widget</Title>
      <Text size="sm" c="dimmed">
        Tenant: {hostContext.tenant.id}
      </Text>
      {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
      <Textarea
        autosize
        minRows={10}
        label="Profile document (JSON)"
        value={editorValue}
        onChange={(event) => setEditorValue(event.currentTarget.value)}
      />
      <Button onClick={handleSave} loading={saving} disabled={!canSave}>
        Save profile
      </Button>
      {profile ? (
        <Text size="xs" c="dimmed">
          Current version: {profile.version}
        </Text>
      ) : null}
    </Stack>
  );
}
