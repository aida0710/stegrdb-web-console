import React, {useState} from 'react';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from '@heroui/table';
import {Pagination} from '@heroui/pagination';
import {Button} from '@heroui/button';
import {Download} from 'lucide-react';

interface QueryResultTableProps {
    results: {
        rows: any[];
        fields: {
            name: string;
            dataTypeID: number;
            tableID: number;
        }[];
        rowCount: number;
        command: string;
        executionTime: number;
    };
}

export function QueryResultTable({results}: QueryResultTableProps) {
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const pages = Math.ceil(results.rows.length / rowsPerPage);
    const start = (page - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, results.rows.length);
    const items = results.rows.slice(start, end);

    const downloadCsv = () => {
        // Generate CSV content
        const headers = results.fields.map((field) => field.name);
        const csvContent = [
            headers.join(','),
            ...results.rows.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];

                        // Handle CSV escaping
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'string') {
                            // Escape quotes and wrap in quotes if contains comma or newline
                            const escaped = value.replace(/"/g, '""');

                            return /[,\n\r"]/.test(value) ? `"${escaped}"` : value;
                        }

                        return String(value);
                    })
                    .join(','),
            ),
        ].join('\n');

        // Create and download the file
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `query_result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!results.rows || results.rows.length === 0) {
        return (
            <div className='p-4 text-center'>
                <p className='mb-2 text-default-500'>クエリは正常に実行されました。</p>
                <p className='text-sm text-default-400'>
                    {results.command === 'SELECT' ? '該当するデータがありません。' : `${results.rowCount}行が影響を受けました。`}
                </p>
                <p className='mt-2 text-xs text-default-400'>実行時間: {results.executionTime}ms</p>
            </div>
        );
    }

    return (
        <div>
            <div className='mb-4 flex items-center justify-between'>
                <div>
                    <p className='text-sm text-default-500'>
                        {results.rowCount}行のデータ | 実行時間: {results.executionTime}ms
                    </p>
                </div>
                <Button
                    color='primary'
                    size='sm'
                    startContent={<Download size={16} />}
                    variant='flat'
                    onPress={downloadCsv}>
                    CSVダウンロード
                </Button>
            </div>

            <Table
                aria-label='クエリ結果テーブル'
                bottomContent={
                    pages > 1 ? (
                        <div className='flex w-full justify-center'>
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color='primary'
                                page={page}
                                total={pages}
                                onChange={setPage}
                            />
                        </div>
                    ) : null
                }
                classNames={{
                    wrapper: 'min-h-[200px]',
                }}>
                <TableHeader>
                    {results.fields.map((field) => (
                        <TableColumn key={field.name}>{field.name}</TableColumn>
                    ))}
                </TableHeader>
                <TableBody>
                    {items.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {results.fields.map((field) => {
                                const value = row[field.name];
                                let displayValue = value;

                                // Format different data types appropriately
                                if (value === null || value === undefined) {
                                    displayValue = <span className='italic text-default-400'>NULL</span>;
                                } else if (typeof value === 'object') {
                                    // Handle objects, dates, etc.
                                    if (value instanceof Date) {
                                        displayValue = value.toLocaleString();
                                    } else {
                                        displayValue = JSON.stringify(value);
                                    }
                                }

                                return <TableCell key={field.name}>{displayValue}</TableCell>;
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
