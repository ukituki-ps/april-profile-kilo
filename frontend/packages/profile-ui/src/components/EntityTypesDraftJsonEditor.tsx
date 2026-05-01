import {
  AprilJsonCollectionTextEditor,
  AprilJsonTreeEditor,
  AprilJsonValidationSummary,
} from "@april/ui";
import { Alert, SegmentedControl, Stack, Text } from "@mantine/core";
import { useCallback, useState } from "react";

/** Минимальная клиентская проверка: черновик — JSON-объект; полная семантика JSON Schema — на сервере. */
export const ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA = { type: "object" } as const;

export type DraftJsonEditorMode = "tree" | "source";

export function parseEntityTypeDraftSchemaText(
  text: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "Invalid JSON syntax." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: "Root value must be a JSON object." };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

export type EntityTypesDraftJsonEditorProps = {
  mode: DraftJsonEditorMode;
  onModeChange: (mode: DraftJsonEditorMode) => void;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  readOnly?: boolean;
  compact?: boolean;
  showSearch?: boolean;
  rootName?: string;
  serverValidationItems?: Array<{ path: string; message: string }>;
};

/**
 * Редактор JSON Schema черновика: дерево (`AprilJsonTreeEditor`) и исходный текст
 * на `AprilJsonCollectionTextEditor` из `@april/ui`.
 */
export function EntityTypesDraftJsonEditor({
  mode,
  onModeChange,
  value,
  onChange,
  sourceText,
  onSourceTextChange,
  readOnly = false,
  compact = false,
  showSearch = true,
  rootName = "draft_schema",
  serverValidationItems,
}: EntityTypesDraftJsonEditorProps) {
  const [sourceSwitchError, setSourceSwitchError] = useState<string | null>(null);

  const handleModeChange = useCallback(
    (next: string) => {
      const m = next as DraftJsonEditorMode;
      if (m === mode) {
        return;
      }
      if (m === "source") {
        onSourceTextChange(JSON.stringify(value, null, 2));
        setSourceSwitchError(null);
        onModeChange("source");
        return;
      }
      const parsed = parseEntityTypeDraftSchemaText(sourceText);
      if (!parsed.ok) {
        setSourceSwitchError(parsed.message);
        return;
      }
      setSourceSwitchError(null);
      onChange(parsed.value);
      onModeChange("tree");
    },
    [mode, onChange, onModeChange, onSourceTextChange, sourceText, value],
  );

  const treeMaxHeight = compact ? 220 : undefined;

  return (
    <Stack gap="xs" style={{ flex: compact ? undefined : 1, minHeight: compact ? 120 : 0 }}>
      {!readOnly ? (
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={handleModeChange}
          data={[
            { label: "Tree", value: "tree" },
            { label: "Source", value: "source" },
          ]}
          aria-label="Draft schema editor mode"
        />
      ) : null}

      {sourceSwitchError ? (
        <Alert color="red" title="Cannot switch to tree">
          <Text size="sm">{sourceSwitchError}</Text>
        </Alert>
      ) : null}

      <AprilJsonValidationSummary title="Server validation" items={serverValidationItems ?? []} />

      {mode === "tree" ? (
        <Stack
          gap="xs"
          style={{
            flex: compact ? undefined : 1,
            minHeight: compact ? 160 : 0,
            maxHeight: compact ? treeMaxHeight : undefined,
            overflow: "auto",
          }}
        >
          <AprilJsonTreeEditor
            data={value}
            setData={
              readOnly
                ? undefined
                : (data: Record<string, unknown> | unknown[]) => {
                    if (!Array.isArray(data)) {
                      onChange(data);
                    }
                  }
            }
            readOnly={readOnly}
            rootName={rootName}
            validationSchema={ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA}
            resolveValidationSchemaRefs={false}
            showSearch={showSearch && !compact}
          />
        </Stack>
      ) : (
        <AprilJsonCollectionTextEditor
          value={sourceText}
          onChange={(next) => {
            onSourceTextChange(next);
            setSourceSwitchError(null);
          }}
          onKeyDown={() => {}}
        />
      )}
    </Stack>
  );
}
