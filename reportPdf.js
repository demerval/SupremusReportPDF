const PDFDocument = require('pdfkit');
const fs = require('fs');

const defaultMargins = {
  top: 20, left: 10, right: 10, bottom: 0
};

const defaultConfig = {
  layout: 'portrait',
  size: 'A4',
  margins: defaultMargins,
  autoFirstPage: false,
  bufferPages: true
};

const fontNormal = './fonts/DejaVuSans.ttf';
const fontBold = './fonts/DejaVuSans-Bold.ttf';

class ReportPDF {

  constructor(file, config) {
    if (config === undefined) {
      config = {};
      config.pdf = defaultConfig;
      config.margins = defaultMargins;
      config.paddingTextLeft = 2;
    }

    if (config.pdf === undefined) {
      config.pdf = defaultConfig;
    }
    if (config.margins === undefined) {
      config.margins = defaultMargins;
    }
    if (config.paddingTextLeft === undefined) {
      config.paddingTextLeft = 2;
    }

    this.margins = config.margins;
    this.paddingTextLeft = config.paddingTextLeft;
    this.paddingTextRight = (this.paddingTextLeft * 2);

    this.pdfDoc = new PDFDocument(config.pdf);
    this.pdfDoc.pipe(fs.createWriteStream(file));
  }

  pageTitle(config) {
    this.titleConfig = config;
  }

  columnHeader(config) {
    this.columnHeaderConfig = new Map();

    for (let c of config) {
      this.columnHeaderConfig.set(c.name.toLowerCase(), c);
    }
  }

  create(values) {
    this.pdfDoc.addPage();

    this.sizePageWidth = this.pdfDoc.page.width;
    this.sizePageHeight = this.pdfDoc.page.height;
    this.pageWidth = (this.sizePageWidth - (this.margins.left + this.margins.right));
    this.pageHeight = (this.sizePageHeight - (this.margins.top + this.margins.bottom));
    if (this.pdfDoc.options.bufferPages) {
      this.pageHeight -= this.pdfDoc.heightOfString('Página');
    }

    this.createPage(true);

    for (let value of values) {
      if (this.isNewPage(value)) {
        this.pdfDoc.addPage();
        this.createPage();
      }

      this.addDetailValue(value, this.pdfDoc.y);
    }

    if (this.pdfDoc.options.bufferPages) {
      this.addPageNumber();
    }

    this.pdfDoc.end();
  }

  isNewPage(value) {
    let names = [];
    Object.getOwnPropertyNames(value).forEach(name => names.push(name));

    let h = 0;
    for (let name of names) {
      let v = this.pdfDoc.heightOfString(value[name]);
      if (v > h) {
        h = v;
      }
    }

    if ((this.pdfDoc.y + h) > this.pageHeight) {
      return true;
    }

    return false;
  }

  createPage(title = false) {
    if (this.titleConfig && title) {
      this.pdfDoc.x = 0;

      for (let config of this.titleConfig) {
        let x = config.x ? config.x : 0;
        let width = config.width ? config.width : this.pageWidth;
        this.texto(config, fontNormal, config.text, 0, this.pdfDoc.y, width);
      }

      this.pdfDoc.y += 2;
    }

    if (this.columnHeaderConfig) {
      this.createTable(this.columnHeaderConfig.values(), this.pdfDoc.y);
    }
  }

  createTable(columns, y) {
    let p = true;
    let ww = 0;
    let x = 0;

    for (let column of columns) {
      const width = (this.pageWidth * (column.p / 100));

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      this.texto(column, fontBold, column.title, x, y, width);
      this.borda(x, y, width);
    }
  }

  addDetailValue(values, y) {
    let p = true;
    let ww = 0;
    let x = 0;

    for (let column of this.columnHeaderConfig.values()) {
      const width = (this.pageWidth * (column.p / 100));

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      let value = values[column.name];
      this.texto(column, fontNormal, value, x, y, width);
    }

    this.linha(0, y, this.pageWidth);
  }

  addPageNumber() {
    let range = this.pdfDoc.bufferedPageRange();
    let totalPage = range.count;
    let y = (this.sizePageHeight - (this.margins.top + this.margins.bottom));

    for (let i = 0; i < totalPage; i++) {
      this.pdfDoc.switchToPage(i);
      this.pdfDoc.y = y;
      this.pdfDoc.x = this.margins.left;
      this.pdfDoc.fillColor('#000000');
      this.pdfDoc.text(`Página ${i + 1} de ${totalPage}`);
    }

    this.pdfDoc.flushPages();
  }

  texto(column, font, text, x, y, width) {
    let color = column.color ? column.color : '#000000';
    let align = column.align ? column.align : 'left';
    let fontSize = column.fontSize ? column.fontSize : 8;

    this.pdfDoc.font(font)
      .fontSize(fontSize)
      .fillColor(color)
      .text(
        text,
        x + this.margins.left + this.paddingTextLeft,
        y,
        {
          width: width - this.paddingTextRight,
          align: align,
          lineGap: 0.5,
          lineBreak: false
        }
      );
  }

  borda(x, y, w) {
    let h = this.pdfDoc.heightOfString('W');
    this.pdfDoc.lineJoin('miter')
      .lineWidth(0.1)
      .rect(x + this.margins.left, y, w, h)
      .stroke();
  }

  linha(x, y, w) {
    let h = this.pdfDoc.heightOfString('W');
    this.pdfDoc.lineJoin('miter')
      .lineWidth(0.1)
      .rect(x + this.margins.left, y + h, w, 0)
      .dash(1, { space: 2 })
      .stroke();
  }

}

module.exports = ReportPDF;