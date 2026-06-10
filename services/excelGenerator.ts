import { utils, writeFileXLSX } from 'xlsx';
import { DownloadTask } from '../types';

export const exportTaskToExcel = (task: DownloadTask) => {
    // --- Hoja de Resumen ---
    const operators = Array.from(new Set(task.closedILPNs.map(i => i.user).filter(Boolean)));
    const summaryData = [
        ["ID Tarea", task.id],
        ["Tipo de Tarea", "Descarga"],
        ["Archivo de Origen", task.fileName],
        ["Tipo de Descarga", task.downloadType],
        ["Usuario Creador", task.user],
        ["Operadores", operators.join(', ') || 'N/A'],
        ["Fecha de Inicio", task.startedAt ? new Date(task.startedAt).toLocaleString() : "N/A"],
        ["Fecha de Finalización", task.completedAt ? new Date(task.completedAt).toLocaleString() : "N/A"],
        ["Total iLPNs Generados", task.closedILPNs.length],
        ["Total Artículos (SKUs únicos)", task.articles.length],
        ["Total Cajas Procesadas", task.closedILPNs.reduce((sum, ilpn) => sum + ilpn.articles.reduce((s, a) => s + a.quantity, 0), 0)]
    ];

    const wsSummary = utils.aoa_to_sheet(summaryData);
     // Set column widths for summary
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];


    // --- Hoja de Detalle de iLPNs ---
    const detailsData: (string | number)[][] = [];
    const headers = [
        "iLPN ID", "Tipo iLPN", "Madre", "Usuario iLPN", "iLPN Creado", "Artículo SKU", "Descripción", "Cód. Barras", "Cantidad"
    ];
    detailsData.push(headers);

    task.closedILPNs.forEach(ilpn => {
        ilpn.articles.forEach(article => {
            const row: (string | number)[] = [
                ilpn.id,
                ilpn.type,
                ilpn.madre,
                ilpn.user || 'N/A',
                new Date(ilpn.createdAt).toLocaleString(),
                article.sku,
                article.description,
                article.barcode || '',
                article.quantity,
            ];
            detailsData.push(row);
        });
    });

    const wsDetails = utils.aoa_to_sheet(detailsData);
     // Set column widths for details
    wsDetails['!cols'] = [
        { wch: 35 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, 
        { wch: 40 }, { wch: 15 }, { wch: 10 }
    ];


    // --- Crear y Descargar el Libro ---
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, wsSummary, "Resumen Tarea");
    utils.book_append_sheet(workbook, wsDetails, "Detalle iLPNs");
    
    const safeFileName = task.fileName.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    writeFileXLSX(workbook, `Reporte-${task.id.substring(0, 8)}-${safeFileName}.xlsx`);
};