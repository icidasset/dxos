//
// Copyright 2024 DXOS.org
//

import { type Space } from '@dxos/react-client/echo';
import { type ColumnDef, type TableDef } from '@dxos/react-ui-table';

import { mapTableToColumns, createColumnsFromTableDef } from '../../schema';
import { type TableType, type TableProp } from '../../types';

/**
 * Mutably updates a given table property in the props array.
 * If the property with the oldId exists, it is updated with the new values.
 * If it doesn't exist, the new property is added to the end of the props array.
 */
export const updateTableProp = (props: TableProp[], oldId: string, update: TableProp) => {
  const idx = props.findIndex((prop) => prop.id === oldId);
  if (idx !== -1) {
    const current = props![idx];
    props.splice(idx, 1, { ...current, ...update });
  } else {
    props.push(update);
  }
};

/**
 * Mutably deletes a given table property from the props array.
 * If the property with the given id exists, it is removed.
 * If it doesn't exist, no action is taken.
 */
export const deleteTableProp = (props: TableProp[], id: string) => {
  if (!props) {
    return;
  }

  const idx = props.findIndex((prop) => prop.id === id);
  if (idx === -1) {
    return;
  }

  props.splice(idx, 1);
};

/**
 * @deprecated
 */
export const createColumns = (
  space: Space | undefined,
  tables: TableType[],
  table: TableType,
  onColumnUpdate: (oldId: string, column: ColumnDef) => void,
  onColumnDelete: (id: string) => void,
  onColumnReorder: (columnId: string, direction: 'right' | 'left') => void,
  onRowUpdate: (object: any, prop: string, value: any) => void,
  onRowDelete: (object: any) => void,
) => {
  const tableDefs: TableDef[] = tables
    .filter((table) => table.schema)
    .map((table) => ({
      id: table.schema!.id,
      name: table.name ?? table.schema?.typename,
      columns: table.schema!.getProperties().map(mapTableToColumns(table)),
    }));

  const tableDef = tableDefs.find((tableDef) => tableDef.id === table.schema?.id);
  if (!tableDef || !space) {
    return [];
  }

  const props = table.props;
  const getColumnIndex = (id: string) => props.findIndex((prop) => prop.id === id);

  // Order table def columns by their position in table.props
  tableDef.columns.sort((a, b) => {
    try {
      const aIdx = getColumnIndex(a.id!);
      const bIdx = getColumnIndex(b.id!);
      if (aIdx === -1 || bIdx === -1) {
        return 0;
      }

      return aIdx - bIdx;
    } catch {
      return 0;
    }
  });

  return createColumnsFromTableDef({
    tableDef,
    tablesToReference: tableDefs,
    space,
    onColumnUpdate,
    onColumnDelete,
    onRowUpdate,
    onRowDelete,
    onColumnReorder,
  });
};
