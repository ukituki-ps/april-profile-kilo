import {
  AprilGradientSegmentedControl,
  AprilJsonCollectionTextEditor,
  AprilJsonSchemaForm,
  AprilJsonTreeEditor,
  AprilJsonValidationSummary,
} from "@april/ui";
import { IconBraces, IconBrackets, IconCode, IconForms } from "@tabler/icons-react";
import type { RJSFSchema } from "@rjsf/utils";
import type { SegmentedControlProps } from "@mantine/core";
import { Alert, Box, Stack, Text, Textarea, VisuallyHidden } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const MODE_ICON_PX = 16;
const MODE_ICON_STROKE = 1.75;

/** Центр сегмента по X/Y; активный сегмент — как в `AprilGradientSegmentedControl` по умолчанию. */
const DRAFT_JSON_MODE_SEGMENTED_STYLES = {
  innerLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  label: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    "&, &:hover": {
      "&[data-active]": {
        color: "var(--mantine-color-white)",
      },
    },
  },
} satisfies NonNullable<SegmentedControlProps["styles"]>;

/** Содержимое сегмента: иконка + скрытое имя для a11y. */
function segmentedIconLabel(icon: ReactNode, accessibleName: string) {
  return (
    <Box
      component="span"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {icon}
      <VisuallyHidden>{accessibleName}</VisuallyHidden>
    </Box>
  );
}

/** Минимальная клиентская проверка: черновик — JSON-объект; полная семантика JSON Schema — на сервере. */
export const ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA = { type: "object" } as const;

export type DraftJsonEditorMode = "form" | "tree" | "source" | "schema";

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

export type DraftJsonEditorToolbarProps = {
  mode: DraftJsonEditorMode;
  onModeChange: (mode: DraftJsonEditorMode) => void;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  readOnly?: boolean;
  compact?: boolean;
  withFormMode?: boolean;
  withSchemaPanel?: boolean;
};

/**
 * Переключатель режимов документа: **AprilGradientSegmentedControl** (иконки + `VisuallyHidden` для a11y).
 */
export function DraftJsonEditorToolbar({
  mode,
  onModeChange,
  value,
  onChange,
  sourceText,
  onSourceTextChange,
  readOnly = false,
  compact = false,
  withFormMode = false,
  withSchemaPanel = false,
}: DraftJsonEditorToolbarProps) {
  const [sourceSwitchError, setSourceSwitchError] = useState<string | null>(null);

  useEffect(() => {
    setSourceSwitchError(null);
  }, [sourceText]);

  useEffect(() => {
    if (mode === "form" && !withFormMode) {
      onModeChange("tree");
    }
  }, [mode, onModeChange, withFormMode]);

  useEffect(() => {
    if (mode === "schema" && !withSchemaPanel) {
      onModeChange(withFormMode ? "form" : "tree");
    }
  }, [mode, onModeChange, withFormMode, withSchemaPanel]);

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

      if (m === "schema") {
        if (!withSchemaPanel) {
          return;
        }
        if (mode === "source") {
          const parsed = parseEntityTypeDraftSchemaText(sourceText);
          if (!parsed.ok) {
            setSourceSwitchError(parsed.message);
            return;
          }
          setSourceSwitchError(null);
          onChange(parsed.value);
        }
        onModeChange("schema");
        return;
      }

      if (m === "form") {
        if (!withFormMode) {
          return;
        }
        if (mode === "source") {
          const parsed = parseEntityTypeDraftSchemaText(sourceText);
          if (!parsed.ok) {
            setSourceSwitchError(parsed.message);
            return;
          }
          setSourceSwitchError(null);
          onChange(parsed.value);
        }
        onModeChange("form");
        return;
      }

      if (m === "tree") {
        if (mode === "form" || mode === "schema") {
          onModeChange("tree");
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
      }
    },
    [mode, onChange, onModeChange, onSourceTextChange, sourceText, value, withFormMode, withSchemaPanel],
  );

  const segmentedData = useMemo(() => {
    const rows: Array<{ value: DraftJsonEditorMode; label: ReactNode }> = [];
    if (withFormMode) {
      rows.push({
        value: "form",
        label: segmentedIconLabel(
          <IconForms size={MODE_ICON_PX} stroke={MODE_ICON_STROKE} aria-hidden />,
          "Form",
        ),
      });
    }
    rows.push(
      {
        value: "tree",
        label: segmentedIconLabel(
          <IconBraces size={MODE_ICON_PX} stroke={MODE_ICON_STROKE} aria-hidden />,
          "Tree",
        ),
      },
      {
        value: "source",
        label: segmentedIconLabel(
          <IconCode size={MODE_ICON_PX} stroke={MODE_ICON_STROKE} aria-hidden />,
          "Source",
        ),
      },
    );
    if (withSchemaPanel) {
      rows.push({
        value: "schema",
        label: segmentedIconLabel(
          <IconBrackets size={MODE_ICON_PX} stroke={MODE_ICON_STROKE} aria-hidden />,
          "Schema",
        ),
      });
    }
    return rows;
  }, [withFormMode, withSchemaPanel]);

  const allowedValues = useMemo(() => new Set(segmentedData.map((row) => row.value)), [segmentedData]);
  const segmentedValue = allowedValues.has(mode) ? mode : segmentedData[0]?.value ?? "tree";

  return (
    <Stack gap="xs" style={{ minWidth: 0 }}>
      <AprilGradientSegmentedControl
        data-testid="draft-json-editor-mode"
        size={compact ? "xs" : "sm"}
        radius="md"
        value={segmentedValue}
        onChange={(next) => {
          if (next !== null) {
            handleModeChange(next);
          }
        }}
        data={segmentedData}
        styles={DRAFT_JSON_MODE_SEGMENTED_STYLES}
      />
      {!readOnly && sourceSwitchError ? (
        <Alert color="red" title="Cannot change document view">
          <Text size="sm">{sourceSwitchError}</Text>
        </Alert>
      ) : null}
    </Stack>
  );
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
  /** Сегмент Form (RJSF), если есть опубликованная схема для документа. */
  withFormMode?: boolean;
  /** `published_schema` для `AprilJsonSchemaForm`. */
  rjsfSchema?: Record<string, unknown>;
  /** Сегмент Schema после Source: read-only опубликованная JSON Schema типа (контент снаружи). */
  withSchemaPanel?: boolean;
  schemaPanel?: ReactNode;
  /** Скрыть встроенный тулбар режимов (рендер снаружи, например в шапке виджета). */
  hideModeToolbar?: boolean;
};

/**
 * JSON-объект: режимы **Form** (если `withFormMode`), **Tree**, **Source**, **Schema** — через `DraftJsonEditorToolbar` / сегменты DS.
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
  withFormMode = false,
  rjsfSchema,
  withSchemaPanel = false,
  schemaPanel,
  hideModeToolbar = false,
}: EntityTypesDraftJsonEditorProps) {
  const treeMaxHeight = compact ? 220 : undefined;

  return (
    <Stack gap="xs" style={{ flex: compact ? undefined : 1, minHeight: compact ? 120 : 0 }}>
      {!hideModeToolbar ? (
        <DraftJsonEditorToolbar
          mode={mode}
          onModeChange={onModeChange}
          value={value}
          onChange={onChange}
          sourceText={sourceText}
          onSourceTextChange={onSourceTextChange}
          readOnly={readOnly}
          compact={compact}
          withFormMode={withFormMode}
          withSchemaPanel={withSchemaPanel}
        />
      ) : null}

      <AprilJsonValidationSummary title="Server validation" items={serverValidationItems ?? []} />

      {mode === "form" && withFormMode && rjsfSchema ? (
        <Box
          style={{
            flex: compact ? undefined : 1,
            minHeight: compact ? 160 : 0,
            maxHeight: compact ? treeMaxHeight : undefined,
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <AprilJsonSchemaForm<Record<string, unknown>>
            hideDefaultSubmit
            readonly={readOnly}
            schema={rjsfSchema as RJSFSchema}
            formData={value}
            onChange={(next) => {
              if (!readOnly) {
                onChange(next as Record<string, unknown>);
              }
            }}
          />
        </Box>
      ) : null}

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
      ) : null}

      {mode === "source" ? (
        readOnly ? (
          <Textarea
            readOnly
            value={sourceText}
            size={compact ? "xs" : "sm"}
            autosize
            minRows={compact ? 5 : 6}
            styles={{
              input: {
                fontFamily: "var(--mantine-font-family-monospace)",
              },
            }}
          />
        ) : (
          <AprilJsonCollectionTextEditor
            value={sourceText}
            onChange={(next) => {
              onSourceTextChange(next);
            }}
            onKeyDown={() => {}}
          />
        )
      ) : null}

      {mode === "schema" && withSchemaPanel && schemaPanel ? (
        <Box style={{ flex: compact ? undefined : 1, minHeight: compact ? 160 : 0, minWidth: 0, overflow: "auto" }}>
          {schemaPanel}
        </Box>
      ) : null}
    </Stack>
  );
}
