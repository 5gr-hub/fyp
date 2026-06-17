import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useMemo } from 'react';

ModuleRegistry.registerModules([AllCommunityModule]);

const defaultColDef = {
  sortable: true,
  resizable: true,
  filter: false,
  suppressMovable: false,
  minWidth: 80,
  cellStyle: { display: 'flex', alignItems: 'center' },
};

const NoRows = ({ message = 'No records found' }) => (
  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
    <svg className="h-10 w-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default function DataTable({
  rowData = [],
  columnDefs = [],
  onRowClicked,
  height = 420,
  pagination = true,
  pageSize = 25,
  loading = false,
  quickFilter = '',
  noRowsMessage,
  className = '',
  suppressPaginationPanel = false,
}) {
  const colDefs = useMemo(() => columnDefs, [columnDefs]);

  return (
    <div
      className={`ag-theme-quartz ${className}`}
      style={{ height: loading && rowData.length === 0 ? 120 : height, width: '100%' }}
    >
      <AgGridReact
        rowData={loading ? [] : rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={[10, 25, 50, 100]}
        suppressPaginationPanel={suppressPaginationPanel}
        onRowClicked={onRowClicked}
        quickFilterText={quickFilter}
        animateRows
        rowSelection="single"
        suppressCellFocus
        noRowsOverlayComponent={() => (
          loading
            ? <div className="flex items-center gap-2 text-slate-400 text-sm py-10">
                <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                Loading…
              </div>
            : <NoRows message={noRowsMessage} />
        )}
      />
    </div>
  );
}
