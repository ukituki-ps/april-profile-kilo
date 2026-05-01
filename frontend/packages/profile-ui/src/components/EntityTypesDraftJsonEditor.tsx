import {
  AprilJsonCollectionTextEditor,
  AprilJsonSchemaForm,
  AprilJsonTreeEditor,
  AprilJsonValidationSummary,
} from "@april/ui";
import { IconBraces, IconBrackets, IconCheck, IconCode, IconDotsVertical, IconForms } from "@tabler/icons-react";
import type { RJSFSchema } from "@rjsf/utils";
import { ActionIcon, Alert, Box, Group, Menu, Stack, Text, Textarea } from "@mantine/core";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const ICON_PX = 16;
const ICON_STROKE = 1.75;

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
};

/**
 * JSON-объект: **Form** (если `withFormMode`) и **Tree** (если нет Form) — снаружи; **Tree**, **Source**, **Schema** — в меню «⋯».
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
}: EntityTypesDraftJsonEditorProps) {
  const [sourceSwitchError, setSourceSwitchError] = useState<string | null>(null);

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

  const treeMaxHeight = compact ? 220 : undefined;

  const overflowModes: DraftJsonEditorMode[] = [];
  if (withFormMode) {
    overflowModes.push("tree", "source");
  } else {
    overflowModes.push("source");
  }
  if (withSchemaPanel) {
    overflowModes.push("schema");
  }

  const modeInOverflow = overflowModes.includes(mode);
  const iconBtnSize = compact ? "sm" : "md";

  const menuItem = (m: DraftJsonEditorMode, label: string, icon: ReactNode) => (
    <Menu.Item
      key={m}
      leftSection={icon}
      rightSection={mode === m ? <IconCheck size={14} stroke={2} aria-hidden /> : null}
      onClick={() => handleModeChange(m)}
    >
      {label}
    </Menu.Item>
  );

  return (
    <Stack gap="xs" style={{ flex: compact ? undefined : 1, minHeight: compact ? 120 : 0 }}>
      <Group gap={6} wrap="nowrap" align="center">
        {withFormMode ? (
          <ActionIcon
            size={iconBtnSize}
            variant={mode === "form" ? "filled" : "default"}
            aria-label="Form"
            title="Form"
            onClick={() => handleModeChange("form")}
          >
            <IconForms size={ICON_PX} stroke={ICON_STROKE} aria-hidden />
          </ActionIcon>
        ) : (
          <ActionIcon
            size={iconBtnSize}
            variant={mode === "tree" ? "filled" : "default"}
            aria-label="Tree"
            title="Tree"
            onClick={() => handleModeChange("tree")}
          >
            <IconBraces size={ICON_PX} stroke={ICON_STROKE} aria-hidden />
          </ActionIcon>
        )}

        <Menu position="bottom-end" withinPortal={false}>
          <Menu.Target>
            <ActionIcon
              size={iconBtnSize}
              variant={modeInOverflow ? "light" : "default"}
              aria-label="More document views"
              title={
                withFormMode
                  ? withSchemaPanel
                    ? "Tree, Source, Schema"
                    : "Tree, Source"
                  : withSchemaPanel
                    ? "Source, Schema"
                    : "Source"
              }
              data-testid="draft-json-editor-more"
            >
              <IconDotsVertical size={ICON_PX} stroke={ICON_STROKE} aria-hidden />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {withFormMode ? (
              <>
                {menuItem(
                  "tree",
                  "Tree",
                  <IconBraces size={ICON_PX} stroke={ICON_STROKE} aria-hidden />,
                )}
                {menuItem(
                  "source",
                  "Source",
                  <IconCode size={ICON_PX} stroke={ICON_STROKE} aria-hidden />,
                )}
              </>
            ) : (
              menuItem(
                "source",
                "Source",
                <IconCode size={ICON_PX} stroke={ICON_STROKE} aria-hidden />,
              )
            )}
            {withSchemaPanel
              ? menuItem(
                  "schema",
                  "Schema",
                  <IconBrackets size={ICON_PX} stroke={ICON_STROKE} aria-hidden />,
                )
              : null}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {!readOnly && sourceSwitchError ? (
        <Alert color="red" title="Cannot switch to tree">
          <Text size="sm">{sourceSwitchError}</Text>
        </Alert>
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
              setSourceSwitchError(null);
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
