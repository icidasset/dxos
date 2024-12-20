//
// Copyright 2024 DXOS.org
//

import React from 'react';

import { CellEditor, type CellEditorProps } from './CellEditor';
import { type GridScopedProps, useGridContext } from '../Grid';

export const GridCellEditor = ({
  extension,
  getCellContent,
  __gridScope,
}: GridScopedProps<Pick<CellEditorProps, 'extension'> & { getCellContent: (index: string) => string | undefined }>) => {
  const { id, editing, setEditing, editBox } = useGridContext('GridSheetCellEditor', __gridScope);

  return editing ? (
    <CellEditor
      variant='grid'
      value={editing.initialContent ?? getCellContent(editing.index)}
      autoFocus
      box={editBox}
      onBlur={() => setEditing(null)}
      extension={extension}
      gridId={id}
    />
  ) : null;
};
