import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types locally since we might not have full type definitions for the library extensions
interface OrderItem {
    product: {
        name: string;
        sku: string;
    };
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    customerName: string | null;
    createdAt: Date | string;
    total: number;
    items: OrderItem[];
}

export const generateOrderPDF = (order: Order) => {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('BizFlow Pro', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Gestão Integrado', 14, 28);

    // Order Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Pedido #${order.id.slice(-6).toUpperCase()}`, 14, 45);

    doc.setFontSize(10);
    doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`, 14, 52);
    doc.text(`Cliente: ${order.customerName || 'Cliente Balcão'}`, 14, 58);

    // Table
    const tableColumn = ["Produto", "SKU", "Qtd", "Preço Unit.", "Total"];
    const tableRows = order.items.map(item => [
        item.product.name,
        item.product.sku,
        item.quantity,
        `R$ ${Number(item.price).toFixed(2)}`,
        `R$ ${(Number(item.price) * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 9 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 65;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Geral: R$ ${Number(order.total).toFixed(2)}`, 14, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Obrigado pela preferência!', 14, finalY + 25);

    // Save
    doc.save(`pedido-${order.id.slice(-6)}.pdf`);
};
