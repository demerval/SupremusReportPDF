//const PDFDocument = require('pdfkit');
//const fs = require('fs');
//
//const sizePageWidth = 595;
//const sizePageHeigth = 810;
//const paddingText = 5;
//const paddingTextRight = (paddingText * 2);
//const margins = {
//  top: 20, left: 10, right: 10, bottom: 0
//};
//
//const fontNormal = './fonts/DejaVuSans.ttf';
//const fontBold = './fonts/DejaVuSans-Bold.ttf';
//
//const pdfDoc = new PDFDocument({ layout: 'portrait', size: 'A4', margins: margins, autoFirstPage: false, bufferPages: true });
//pdfDoc.pipe(fs.createWriteStream('rel.pdf'));
//
//let widthPage = (sizePageWidth - (margins.left + margins.right));
//pdfDoc.y = margins.top;
//pdfDoc.x = 0;
//
//const colunas = [
//  { text: 'Razao Social', align: 'left', p: 40 },
//  { text: 'NomeFantasia', align: 'left', p: 20 },
//  { text: 'Data', align: 'center', p: 20 },
//  { text: 'Limite', align: 'right', p: 10 },
//  { text: 'Valor', align: 'right', p: 10 },
//];
//
//const valores = [
//  { text: 'Empresa de Teste', align: 'left', p: 40 },
//  { text: 'Sem Nome', align: 'left', p: 20 },
//  { text: '18/06/2018', align: 'center', p: 20 },
//  { text: '1.000,00', align: 'right', p: 10 },
//  { text: '589,76', align: 'right', p: 10, color: 'red' },
//];
//
//pdfDoc.addPage();
//pageTitle(pdfDoc);
//columnHeader(pdfDoc);
//
//for (let i = 0; i < 10; i++) {
//  createTable(pdfDoc, fontNormal, pdfDoc.y, valores, true);
//
//  if (pdfDoc.y > sizePageHeigth) {
//    pdfDoc.addPage();
//    columnHeader(pdfDoc);
//  }
//}
//
//let range = pdfDoc.bufferedPageRange();
//let totalPage = range.count;
//
//for (let i = 0; i < totalPage; i++) {
//  pdfDoc.switchToPage(i);
//  pdfDoc.y = 825;
//  pdfDoc.x = margins.left;
//  pdfDoc.fillColor('#000000');
//  pdfDoc.text(`Página ${i + 1} de ${totalPage}`);
//}
//
//pdfDoc.flushPages();
//
//pdfDoc.end();
//
//function pageTitle(doc) {
//  doc.font(fontBold)
//    .fontSize(10)
//    .fillColor('#000000')
//    .text('Relatório de Teste', { width: sizePageWidth, align: 'center' });
//  doc.y += 2;
//}
//
//function columnHeader(doc) {
//  createTable(doc, fontBold, doc.y, colunas, true);
//}
//
//function createTable(doc, font, y, columns, isBorda = false) {
//  let p = 0;
//  let ww = 0;
//  let x = 0;
//
//  for (let column of columns) {
//    const width = (widthPage * (column.p / 100));
//
//    //doc.y = y;
//    if (p === 0) {
//      doc.x = 0;
//    } else {
//      doc.x = ww;
//    }
//
//    ww = (doc.x + width);
//    x = doc.x;
//
//    texto(doc, font, column, x, y, width, column.align);
//    if (isBorda) {
//      borda(doc, x, y, width);
//    }
//
//    p++;
//  }
//}
//
//function texto(doc, font, column, x, y, w, align) {
//  let color = column.color ? column.color : '#000000';
//
//  doc.font(font)
//    .fontSize(6)
//    .fillColor(color)
//    .text(column.text, x + margins.left + paddingText, y, { width: w - paddingTextRight, align: align, lineGap: 0.5, lineBreak: false });
//}
//
//function borda(doc, x, y, w) {
//  doc.lineJoin('miter')
//    .lineWidth(0.1)
//    .rect(x + margins.left, y + 7.5, w, 0)
//    .stroke();
//}

const ReportPDF = require('./reportPdf');

const report = new ReportPDF('rel.pdf');

const title = [
  { text: 'Relatório de Teste', align: 'center', fontSize: 18 },
  { text: 'Empresa: SUPREMUS TECNOLOGIA' },
  { text: 'Período de: 21/06/2018 Até: 21/06/2018' },
]

const columns = [
  { name: 'razao', title: 'Razão Social', p: 40 },
  { name: 'fantasia', title: 'Nome Fantasia', p: 40 },
  { name: 'valor', title: 'Valor', align: 'right', p: 20 },
];

const values = [];

for (let i = 0; i < 301; i++) {
  values.push({ razao: 'EMPRESA DE TESTE 01', fantasia: 'TESTE 01', valor: i });
}

report.pageTitle(title);
report.columnHeader(columns);
report.create(values);