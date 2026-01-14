import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export transactions to PDF with professional formatting
 */
export function exportToPDF(transactions, options = {}) {
    const {
        title = 'Transaction Statement',
        dateRange = null,
        includeStats = true,
    } = options;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(245, 158, 11); // Amber color
    doc.text('FX Wallet', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, 30, { align: 'center' });

    // Date range
    if (dateRange) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(dateRange, pageWidth / 2, 37, { align: 'center' });
    }

    let yPosition = 45;

    // Summary statistics
    if (includeStats && transactions.length > 0) {
        const totalIncome = transactions
            .filter(tx => tx.transaction_type === 'receive')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const totalExpenses = transactions
            .filter(tx => tx.transaction_type === 'send')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const netBalance = totalIncome - totalExpenses;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Stats box
        doc.setFillColor(250, 250, 250);
        doc.rect(14, yPosition, pageWidth - 28, 25, 'F');

        yPosition += 8;
        doc.text(`Total Transactions: ${transactions.length}`, 20, yPosition);
        yPosition += 6;
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, yPosition);
        yPosition += 6;
        doc.setTextColor(239, 68, 68); // Red
        doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, yPosition);
        yPosition += 6;
        doc.setTextColor(netBalance >= 0 ? 16 : 239, netBalance >= 0 ? 185 : 68, netBalance >= 0 ? 129 : 68);
        doc.text(`Net Balance: $${netBalance.toFixed(2)}`, 20, yPosition);

        yPosition += 10;
    }

    // Transactions table
    const tableData = transactions.map(tx => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.transaction_type,
        tx.description || 'N/A',
        `${tx.currency} ${Math.abs(tx.amount).toFixed(2)}`,
        tx.status,
        tx.category || 'other',
    ]);

    doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Type', 'Description', 'Amount', 'Status', 'Category']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [245, 158, 11], // Amber
            textColor: [0, 0, 0],
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
        },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
        doc.text(
            `Generated on ${new Date().toLocaleString()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 6,
            { align: 'center' }
        );
    }

    // Save
    const filename = `transactions-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return filename;
}

/**
 * Export transactions to Excel with formatting
 */
export function exportToExcel(transactions, options = {}) {
    const {
        filename = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`,
        includeStats = true,
    } = options;

    // Prepare data
    const data = transactions.map(tx => ({
        'Date': new Date(tx.created_at).toLocaleString(),
        'Type': tx.transaction_type,
        'Description': tx.description || 'N/A',
        'Amount': Math.abs(tx.amount),
        'Currency': tx.currency,
        'Status': tx.status,
        'Category': tx.category || 'other',
        'Recipient/Sender': tx.recipient_name || tx.sender_name || 'N/A',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add transactions sheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, // Date
        { wch: 10 }, // Type
        { wch: 30 }, // Description
        { wch: 12 }, // Amount
        { wch: 10 }, // Currency
        { wch: 10 }, // Status
        { wch: 15 }, // Category
        { wch: 20 }, // Recipient/Sender
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Add summary sheet if requested
    if (includeStats && transactions.length > 0) {
        const totalIncome = transactions
            .filter(tx => tx.transaction_type === 'receive')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const totalExpenses = transactions
            .filter(tx => tx.transaction_type === 'send')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const summaryData = [
            { Metric: 'Total Transactions', Value: transactions.length },
            { Metric: 'Total Income', Value: `$${totalIncome.toFixed(2)}` },
            { Metric: 'Total Expenses', Value: `$${totalExpenses.toFixed(2)}` },
            { Metric: 'Net Balance', Value: `$${(totalIncome - totalExpenses).toFixed(2)}` },
            { Metric: 'Average Transaction', Value: `$${(transactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / transactions.length).toFixed(2)}` },
        ];

        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    // Write file
    XLSX.writeFile(wb, filename);

    return filename;
}

/**
 * Generate a receipt PDF for a single transaction
 */
export function generateReceipt(transaction) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with logo placeholder
    doc.setFontSize(24);
    doc.setTextColor(245, 158, 11);
    doc.text('FX Wallet', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Transaction Receipt', pageWidth / 2, 40, { align: 'center' });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, pageWidth - 20, 45);

    let y = 60;

    // Transaction details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const addRow = (label, value) => {
        doc.setTextColor(100, 100, 100);
        doc.text(label, 20, y);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), pageWidth - 20, y, { align: 'right' });
        y += 10;
    };

    addRow('Transaction ID:', `#${transaction.id}`);
    addRow('Date:', new Date(transaction.created_at).toLocaleString());
    addRow('Type:', transaction.transaction_type);
    addRow('Description:', transaction.description || 'N/A');
    addRow('Status:', transaction.status);

    if (transaction.recipient_name) {
        addRow('Recipient:', transaction.recipient_name);
    }
    if (transaction.sender_name) {
        addRow('Sender:', transaction.sender_name);
    }

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 15;

    // Amount (highlighted)
    doc.setFillColor(250, 250, 250);
    doc.rect(20, y - 8, pageWidth - 40, 20, 'F');

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Amount:', 25, y);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const currencySymbol = transaction.currency === 'USD' ? '$' : transaction.currency === 'EUR' ? '€' : transaction.currency;
    doc.text(
        `${currencySymbol} ${Math.abs(transaction.amount).toFixed(2)}`,
        pageWidth - 25,
        y,
        { align: 'right' }
    );

    y += 30;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
        'This is an official transaction receipt from FX Wallet',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
    );
    doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
    );

    // Save
    const filename = `receipt-${transaction.id}.pdf`;
    doc.save(filename);

    return filename;
}
