import { read, utils, WorkBook, WorkSheet } from 'xlsx';
import { Article, DownloadType } from '../types';

// Simple UUID generator to avoid dependency on crypto.randomUUID() which requires a secure context (HTTPS)
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Helper function to find a property in an object with case-insensitivity
const findProp = (obj: any, propNames: string[]): any => {
    for (const name of propNames) {
        if (obj[name] !== undefined) return obj[name];
    }
    const lowerCasePropNames = propNames.map(p => p.toLowerCase());
    for (const key in obj) {
        if (lowerCasePropNames.includes(key.toLowerCase())) {
            return obj[key];
        }
    }
    return undefined;
};

const sheetNameMapping: Record<DownloadType, string> = {
    [DownloadType.TATA]: 'TATA_1',
    [DownloadType.HYG]: 'HYG_2',
    [DownloadType.BAS]: 'BAS_3',
};

export const parseExcelFile = async (file: File, downloadType: DownloadType): Promise<{ articles: Article[], fileName: string }> => {
  console.log(`Parsing Excel file: ${file.name} for type: ${downloadType}`);
  const fileName = file.name;
  
  return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
          try {
              if (!event.target?.result) {
                  return reject(new Error("Failed to read file."));
              }
              const data = event.target.result;
              const workbook: WorkBook = read(data, { type: 'array' });
              
              const targetSheetName = sheetNameMapping[downloadType];
              const actualSheetName = workbook.SheetNames.find((name: string) => name.toUpperCase() === targetSheetName.toUpperCase());

              if (!actualSheetName) {
                return reject(new Error(`La hoja "${targetSheetName}" no fue encontrada en el archivo Excel.`));
              }

              const worksheet: WorkSheet = workbook.Sheets[actualSheetName];
              
              const jsonData: any[] = utils.sheet_to_json(worksheet);

              if (!jsonData || jsonData.length === 0) {
                  return reject(new Error(`La hoja "${actualSheetName}" está vacía o no tiene el formato esperado.`));
              }
              
              const articles: Article[] = jsonData.map((row, index): Article | null => {
                  const sku = findProp(row, ['Item', 'SKU']);
                  const description = findProp(row, ['Description', 'descripcion', 'descripción']);
                  const madre = findProp(row, ['Madre']);
                  const barcode = findProp(row, ['Código de Barras', 'Barcode']);
                  
                  // --- CORRECTED QUANTITY LOGIC (User Feedback) ---
                  // The total quantity is ALWAYS the sum of stock and cross dock.
                  const crossVal = findProp(row, ['Cajas Cross']);
                  const stockVal = findProp(row, ['Cajas Stock']);

                  const quantityCross = crossVal !== undefined ? Number(crossVal) : 0;
                  const quantityStock = stockVal !== undefined ? Number(stockVal) : 0;
                  
                  const totalQuantity = quantityStock + quantityCross;
                  // --- END OF CORRECTION ---

                  if (sku === undefined || description === undefined || totalQuantity === 0) {
                      if (!(sku === undefined && description === undefined && totalQuantity === 0)) {
                          console.warn(`Skipping row ${index + 2} in sheet "${actualSheetName}" due to missing essential data or zero quantity.`);
                      }
                      return null;
                  }

                  return {
                      id: generateUUID(),
                      sku: String(sku).trim(),
                      barcode: barcode ? String(barcode).trim() : undefined,
                      description: String(description).trim(),
                      quantity: totalQuantity,
                      quantityStock: quantityStock,
                      quantityCross: quantityCross,
                      madre: String(madre || '').trim(),
                  };
              }).filter((article): article is Article => article !== null && Boolean(article.sku));

              console.log(`Successfully parsed ${articles.length} articles from sheet "${actualSheetName}".`);
              resolve({ articles, fileName });

          } catch (error) {
              console.error("Error parsing Excel file:", error);
              if (error instanceof Error) {
                  reject(new Error(`Error al procesar el archivo Excel: ${error.message}`));
              } else {
                  reject(new Error("Ocurrió un error desconocido al procesar el archivo Excel."));
              }
          }
      };

      reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(new Error("No se pudo leer el archivo."));
      };
      
      reader.readAsArrayBuffer(file);
  });
};