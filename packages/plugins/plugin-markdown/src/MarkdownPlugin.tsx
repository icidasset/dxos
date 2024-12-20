//
// Copyright 2023 DXOS.org
//

import { TextAa } from '@phosphor-icons/react';
import React from 'react';

import {
  parseIntentPlugin,
  resolvePlugin,
  LayoutAction,
  type LayoutCoordinate,
  NavigationAction,
  type PluginDefinition,
} from '@dxos/app-framework';
import { create } from '@dxos/echo-schema';
import { LocalStorageStore } from '@dxos/local-storage';
import { parseClientPlugin } from '@dxos/plugin-client';
import { type ActionGroup, createExtension, isActionGroup } from '@dxos/plugin-graph';
import { SpaceAction } from '@dxos/plugin-space';
import { CollectionType } from '@dxos/plugin-space/types';
import {
  createDocAccessor,
  fullyQualifiedId,
  getRangeFromCursor,
  isSpace,
  loadObjectReferences,
} from '@dxos/react-client/echo';
import {
  type EditorInputMode,
  type EditorViewMode,
  EditorViewModes,
  translations as editorTranslations,
  createEditorStateStore,
} from '@dxos/react-ui-editor';

import { MarkdownContainer, MarkdownSettings } from './components';
import meta, { MARKDOWN_PLUGIN } from './meta';
import translations from './translations';
import { DocumentType, isEditorModel, TextType } from './types';
import {
  type MarkdownPluginProvides,
  type MarkdownSettingsProps,
  MarkdownAction,
  type MarkdownPluginState,
} from './types';
import { markdownExtensionPlugins, serializer } from './util';

// TODO(burdon): Normalize active/object.
const getDoc = (object: any) => (object instanceof DocumentType ? object : undefined);

export const MarkdownPlugin = (): PluginDefinition<MarkdownPluginProvides> => {
  const settings = new LocalStorageStore<MarkdownSettingsProps>(MARKDOWN_PLUGIN, {
    defaultViewMode: 'preview',
    toolbar: true,
    numberedHeadings: true,
    folding: true,
    experimental: false,
  });

  const editorStateStore = createEditorStateStore(`${MARKDOWN_PLUGIN}/editor`);

  const state = new LocalStorageStore<MarkdownPluginState>(MARKDOWN_PLUGIN, { extensionProviders: [], viewMode: {} });

  const getViewMode = (id: string) => (id && state.values.viewMode[id]) || settings.values.defaultViewMode;
  const setViewMode = (id: string, viewMode: EditorViewMode) => (state.values.viewMode[id] = viewMode);

  return {
    meta,
    ready: async (plugins) => {
      settings
        .prop({ key: 'defaultViewMode', type: LocalStorageStore.enum<EditorViewMode>() })
        .prop({ key: 'editorInputMode', type: LocalStorageStore.enum<EditorInputMode>({ allowUndefined: true }) })
        .prop({ key: 'toolbar', type: LocalStorageStore.bool({ allowUndefined: true }) })
        .prop({ key: 'experimental', type: LocalStorageStore.bool({ allowUndefined: true }) })
        .prop({ key: 'debug', type: LocalStorageStore.bool({ allowUndefined: true }) })
        .prop({ key: 'typewriter', type: LocalStorageStore.string({ allowUndefined: true }) })
        .prop({ key: 'numberedHeadings', type: LocalStorageStore.bool({ allowUndefined: true }) })
        .prop({ key: 'folding', type: LocalStorageStore.bool({ allowUndefined: true }) });

      state.prop({ key: 'viewMode', type: LocalStorageStore.json<{ [key: string]: EditorViewMode }>() });

      markdownExtensionPlugins(plugins).forEach((plugin) => {
        const { extensions } = plugin.provides.markdown;
        state.values.extensionProviders?.push(extensions);
      });
    },
    provides: {
      settings: settings.values,
      metadata: {
        records: {
          [DocumentType.typename]: {
            label: (object: any) => (object instanceof DocumentType ? object.name || object.fallbackName : undefined),
            placeholder: ['document title placeholder', { ns: MARKDOWN_PLUGIN }],
            icon: 'ph--text-aa--regular',
            graphProps: {
              managesAutofocus: true,
            },
            // TODO(wittjosiah): Move out of metadata.
            loadReferences: (doc: DocumentType) => loadObjectReferences(doc, (doc) => [doc.content, ...doc.threads]),
            serializer,
          },
        },
      },
      translations: [...translations, ...editorTranslations],
      echo: {
        schema: [DocumentType, TextType],
      },
      space: {
        onSpaceCreate: {
          label: ['create document label', { ns: MARKDOWN_PLUGIN }],
          action: MarkdownAction.CREATE,
        },
      },
      graph: {
        builder: (plugins) => {
          const client = resolvePlugin(plugins, parseClientPlugin)?.provides.client;
          const dispatch = resolvePlugin(plugins, parseIntentPlugin)?.provides.intent.dispatch;
          if (!client || !dispatch) {
            return [];
          }

          return createExtension({
            id: MarkdownAction.CREATE,
            filter: (node): node is ActionGroup => isActionGroup(node) && node.id.startsWith(SpaceAction.ADD_OBJECT),
            actions: ({ node }) => {
              const id = node.id.split('/').at(-1);
              const [spaceId, objectId] = id?.split(':') ?? [];
              const space = client.spaces.get().find((space) => space.id === spaceId);
              const object = objectId && space?.db.getObjectById(objectId);
              const target = objectId ? object : space;
              if (!target) {
                return;
              }

              return [
                {
                  id: `${MARKDOWN_PLUGIN}/create/${node.id}`,
                  data: async () => {
                    await dispatch([
                      { plugin: MARKDOWN_PLUGIN, action: MarkdownAction.CREATE },
                      { action: SpaceAction.ADD_OBJECT, data: { target } },
                      { action: NavigationAction.OPEN },
                    ]);
                  },
                  properties: {
                    label: ['create document label', { ns: MARKDOWN_PLUGIN }],
                    icon: 'ph--text-aa--regular',
                    testId: 'markdownPlugin.createObject',
                  },
                },
              ];
            },
          });
        },
        serializer: (plugins) => {
          const dispatch = resolvePlugin(plugins, parseIntentPlugin)?.provides.intent.dispatch;
          if (!dispatch) {
            return [];
          }
          return [
            {
              inputType: DocumentType.typename,
              outputType: 'text/markdown',
              // Reconcile with metadata serializers.
              serialize: async (node) => {
                const doc = node.data;
                const content = await loadObjectReferences(doc, (doc) => doc.content);
                return {
                  name:
                    doc.name ||
                    doc.fallbackName ||
                    translations[0]['en-US'][MARKDOWN_PLUGIN]['document title placeholder'],
                  data: content.content,
                  type: 'text/markdown',
                };
              },
              deserialize: async (data, ancestors) => {
                const space = ancestors.find(isSpace);
                const target =
                  ancestors.findLast((ancestor) => ancestor instanceof CollectionType) ??
                  space?.properties[CollectionType.typename];
                if (!space || !target) {
                  return;
                }

                const result = await dispatch([
                  {
                    plugin: MARKDOWN_PLUGIN,
                    action: MarkdownAction.CREATE,
                    data: { name: data.name, content: data.data },
                  },
                  {
                    action: SpaceAction.ADD_OBJECT,
                    data: { target },
                  },
                ]);

                return result?.data.object;
              },
            },
          ];
        },
      },
      stack: {
        creators: [
          {
            id: 'create-stack-section-doc',
            testId: 'markdownPlugin.createSection',
            type: ['plugin name', { ns: MARKDOWN_PLUGIN }],
            label: ['create stack section label', { ns: MARKDOWN_PLUGIN }],
            icon: (props: any) => <TextAa {...props} />,
            intent: {
              plugin: MARKDOWN_PLUGIN,
              action: MarkdownAction.CREATE,
            },
          },
        ],
      },
      thread: {
        predicate: (obj) => obj instanceof DocumentType,
        createSort: (doc: DocumentType) => {
          const accessor = doc.content ? createDocAccessor(doc.content, ['content']) : undefined;
          if (!accessor) {
            return (_) => 0;
          }

          const getStartPosition = (cursor: string | undefined) => {
            const range = cursor ? getRangeFromCursor(accessor, cursor) : undefined;
            return range?.start ?? Number.MAX_SAFE_INTEGER;
          };

          return (anchorA: string | undefined, anchorB: string | undefined): number => {
            if (anchorA === undefined || anchorB === undefined) {
              return 0;
            }
            const posA = getStartPosition(anchorA);
            const posB = getStartPosition(anchorB);
            return posA - posB;
          };
        },
      },
      surface: {
        component: ({ data, role }) => {
          switch (role) {
            case 'section':
            case 'article': {
              // TODO(burdon): Normalize types (from FilesPlugin).
              const doc = getDoc(data.active) ?? getDoc(data.object);
              const { id, object } = isEditorModel(data.object)
                ? { id: data.object.id, object: data.object }
                : doc
                  ? { id: fullyQualifiedId(doc), object: doc }
                  : {};

              if (!id || !object) {
                return null;
              }

              return (
                <MarkdownContainer
                  id={id}
                  object={object}
                  role={role}
                  coordinate={data.coordinate as LayoutCoordinate}
                  settings={settings.values}
                  extensionProviders={state.values.extensionProviders}
                  viewMode={getViewMode(id)}
                  editorStateStore={editorStateStore}
                  onViewModeChange={setViewMode}
                />
              );
            }

            case 'settings': {
              return data.plugin === meta.id ? <MarkdownSettings settings={settings.values} /> : null;
            }
          }

          return null;
        },
      },
      intent: {
        resolver: ({ action, data }) => {
          switch (action) {
            case MarkdownAction.CREATE: {
              const doc = create(DocumentType, {
                name: data?.name,
                content: create(TextType, { content: data?.content ?? '' }),
                threads: [],
              });

              return {
                data: doc,
                intents: [[{ action: LayoutAction.SCROLL_INTO_VIEW, data: { id: fullyQualifiedId(doc) } }]],
              };
            }

            case MarkdownAction.SET_VIEW_MODE: {
              const { id, viewMode } = data ?? {};
              if (typeof id === 'string' && EditorViewModes.includes(viewMode)) {
                state.values.viewMode[id] = viewMode;
                return { data: true };
              }

              break;
            }
          }
        },
      },
    },
  };
};
