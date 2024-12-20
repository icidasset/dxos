//
// Copyright 2024 DXOS.org
//

import React, { useEffect, useMemo } from 'react';

import { useResolvePlugin, parseFileManagerPlugin } from '@dxos/app-framework';
import { fullyQualifiedId, getSpace } from '@dxos/react-client/echo';

import { MarkdownEditor, type MarkdownEditorProps } from './MarkdownEditor';
import { useExtensions } from '../extensions';
import { DocumentType, type MarkdownSettingsProps } from '../types';
import { getFallbackName } from '../util';

export type MarkdownContainerProps = Pick<
  MarkdownEditorProps,
  'role' | 'coordinate' | 'extensionProviders' | 'viewMode' | 'editorStateStore' | 'onViewModeChange'
> & {
  id: string;
  object: DocumentType | any;
  settings: MarkdownSettingsProps;
};

// TODO(burdon): Move toolbar here.
// TODO(burdon): Factor out difference for ECHO and non-ECHO objects; i.e., single component.
const MarkdownContainer = ({ id, role, object, settings, ...props }: MarkdownContainerProps) => {
  const scrollPastEnd = role === 'article';
  if (object instanceof DocumentType) {
    return (
      <DocumentEditor
        id={fullyQualifiedId(object)}
        role={role}
        document={object}
        settings={settings}
        scrollPastEnd={scrollPastEnd}
        {...props}
      />
    );
  } else {
    return (
      <MarkdownEditor
        id={id}
        role={role}
        initialValue={object.text}
        toolbar={settings.toolbar}
        scrollPastEnd={scrollPastEnd}
        {...props}
      />
    );
  }
};

type DocumentEditorProps = Omit<MarkdownContainerProps, 'object'> & { document: DocumentType } & Pick<
    MarkdownEditorProps,
    'id' | 'scrollPastEnd'
  >;

export const DocumentEditor = ({
  id,
  document: doc,
  extensionProviders,
  settings,
  viewMode,
  editorStateStore,
  ...props
}: DocumentEditorProps) => {
  const space = getSpace(doc);
  const initialValue = useMemo(() => doc.content?.content, [doc.content]);
  const extensions = useExtensions({ extensionProviders, document: doc, settings, viewMode, editorStateStore });

  // Migrate gradually to `fallbackName`.
  useEffect(() => {
    if (!doc.fallbackName && doc.content?.content) {
      doc.fallbackName = getFallbackName(doc.content.content);
    }
  }, [doc, doc.content]);

  // File dragging.
  const fileManagerPlugin = useResolvePlugin(parseFileManagerPlugin);
  const handleFileUpload = useMemo(() => {
    if (space === undefined || fileManagerPlugin?.provides.file.upload === undefined) {
      return undefined;
    }

    // TODO(burdon): Re-order props: space, file.
    return async (file: File) => fileManagerPlugin?.provides?.file?.upload?.(file, space);
  }, [space, fileManagerPlugin]);

  return (
    <MarkdownEditor
      id={id}
      initialValue={initialValue}
      extensions={extensions}
      toolbar={settings.toolbar}
      inputMode={settings.editorInputMode}
      viewMode={viewMode}
      onFileUpload={handleFileUpload}
      {...props}
    />
  );
};

export default MarkdownContainer;
