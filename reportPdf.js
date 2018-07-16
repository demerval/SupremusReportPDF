const PDFDocument = require('pdfkit');
const fs = require('fs');
const blobStream = require('blob-stream');
const TextConfig = require('./textConfig');
const moment = require('moment');
const format = require('./format');

const defaultMargins = {
  top: 20, left: 10, right: 10, bottom: 10
};

const defaultConfig = {
  layout: 'portrait',
  size: 'A4',
  margins: defaultMargins,
  autoFirstPage: false,
  bufferPages: true
};

class ReportPDF {

  constructor(file, userName, config) {
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
    this.stream = this.pdfDoc.pipe(blobStream());
    this.variaves = new Map();
    this.userName = userName;
    this.isGroup = false;
  }

  pageTitle(config) {
    this.titleConfig = config;
  }

  groupConfig(config) {
    this.group = config;
    this.isGroup = true;
  }

  columnHeader(config) {
    this.columnHeaderConfig = new Map();

    for (let c of config) {
      this.columnHeaderConfig.set(c.name.toLowerCase(), c);
      if (c.summary) {
        this.variaves.set(c.name, { ...c.summary, value: 0 });
      }
    }
  }

  create(values, res) {
    this.pdfDoc.addPage();

    this.sizePageWidth = this.pdfDoc.page.width;
    this.sizePageHeight = this.pdfDoc.page.height;
    this.pageWidth = (this.sizePageWidth - (this.margins.left + this.margins.right));
    this.pageHeight = (this.sizePageHeight - (this.margins.top + this.margins.bottom));
    if (this.pdfDoc.options.bufferPages) {
      this.pageHeight -= this.pdfDoc.heightOfString('Página');
    }

    let notGroup = true;
    this.createPage(true);

    for (let value of values) {
      if (this.isGroup) {
        if (notGroup) {
          this.pdfDoc.y += 4;
          notGroup = false;
        }
        this.groupHeader(value);
      }

      if (this.isNewPage(value)) {
        this.pdfDoc.addPage();
        this.createPage();
      }

      this.addDetailValue(value, this.pdfDoc.y);
    }

    if (this.isGroup) {
      let v = { summary: 'W' };
      this.groupFooter(v);
    }

    if (this.variaves.size > 0) {
      let v = { summary: 'W' };
      if (this.isNewPage(v)) {
        this.pdfDoc.addPage();
        this.createPage();
      }

      this.addSummary();
    }

    if (this.pdfDoc.options.bufferPages) {
      this.addPageNumber();
    }

    this.pdfDoc.end();
    this.stream.on('finish', () => {
      res.send(stream.toBlobURL('application/pdf'));
    });
  }

  groupHeader(values) {
    let field = this.group.config.name;
    let groupValue = values[field];

    if (this.group.value === groupValue) {
      this.groupTotalizar(values);
      return;
    }

    if (this.group.value !== undefined) {
      this.groupFooter(values);
    }

    this.groupTotalizar(values);

    this.group.value = groupValue;

    if (this.isNewPage(values)) {
      this.pdfDoc.addPage();
      this.createPage();
    }

    let y = this.pdfDoc.y;
    let p = true;
    let ww = 0;
    let x = 0;
    let hFont = 0;

    let headerFields = this.group.header.fields;
    for (let field of headerFields) {
      let textConfig = new TextConfig(field.config);
      let width = this.pageWidth;
      if (field.config.width < 100) {
        width = (this.pageWidth * (field.config.width / 100));
      }

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      let value = field.title ? field.title : values[field.name];
      this.texto(textConfig, value, x, y, width);

      if (textConfig.fontSize > hFont) {
        hFont = textConfig.fontSize;
      }
    }

    this.pdfDoc.y += hFont;
  }

  groupTotalizar(values) {
    let footerFields = this.group.footer;
    for (let field of footerFields) {
      if (field.summary) {
        let summary = field.summary;
        if (summary.value === undefined) {
          if (summary.type === 'sum') {
            summary.value = values[field.name];
          } else if (summary.type === 'count') {
            summary.value = 1;
          } else if (summary.type === 'field') {
            if (summary.fieldName) {
              summary.value = values[summary.fieldName];
            } else {
              summary.value = values[field.name];
            }
          }
        } else {
          if (summary.type === 'sum') {
            summary.value += values[field.name];
          } else if (summary.type === 'count') {
            summary.value += 1;
          }
        }
      }
    }
  }

  groupFooter(values) {
    if (this.isNewPage(values)) {
      this.pdfDoc.addPage();
      this.createPage();
    }

    let p = true;
    let ww = 0;
    let x = 0;
    let y = this.pdfDoc.y;

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

      let textConfig = new TextConfig(column);

      let value = undefined;
      let config = this.group.footer.find(c => c.name == column.name);
      if (config !== undefined && config.summary) {
        let summary = config.summary;
        value = summary.value;

        if (summary.color) {
          textConfig.color = summary.color;
        }
        if (summary.align) {
          textConfig.align = summary.align;
        }
        if (summary.fontBold) {
          textConfig.fontBold = true;
        }

        if (summary.getValue !== undefined && typeof summary.getValue === 'function') {
          let ret = summary.getValue(value, textConfig);
          value = ret.value;
          textConfig = ret.config;
        }

        summary.value = undefined;
        if (summary.format) {
          value = format.formatar(summary.format, value);
        }
      }

      this.texto(textConfig, value, x, y, width);
      this.borda(x, y, width);
    }

    this.pdfDoc.y += 4;
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
        let textConfig = new TextConfig(config);

        this.texto(textConfig, config.text, 0, this.pdfDoc.y, width);
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

      let textConfig = new TextConfig(column);
      textConfig.fontBold = true;

      this.texto(textConfig, column.title, x, y, width);
      this.borda(x, y, width);
    }
  }

  addDetailValue(values, y) {
    let p = true;
    let ww = 0;
    let x = 0;

    for (let column of this.columnHeaderConfig.values()) {
      const width = (this.pageWidth * (column.p / 100));
      const summary = this.variaves.get(column.name);

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      let value = values[column.name];
      let textConfig = new TextConfig(column);

      if (column.getValue !== undefined && typeof column.getValue === 'function') {
        let ret = column.getValue(value, textConfig);
        value = ret.value;
        textConfig = ret.config;
      }

      if (summary) {
        if (summary.type === 'sum') {
          summary.value += value;
        } else if (summary.type === 'count') {
          summary.value += 1;
        }
      }
      if (column.format) {
        value = format.formatar(column.format, value);
      }

      this.texto(textConfig, value, x, y, width);
      this.borda(x, y, width);
    }

  }

  addSummary() {
    this.addSummaryTitle();

    let v = { summary: 'W' };
    if (this.isNewPage(v)) {
      this.pdfDoc.addPage();
      this.createPage();
    }

    let p = true;
    let ww = 0;
    let x = 0;
    let y = this.pdfDoc.y;

    for (let column of this.columnHeaderConfig.values()) {
      const width = (this.pageWidth * (column.p / 100));
      const summary = this.variaves.get(column.name);

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      let textConfig = new TextConfig(column);
      textConfig.fontBold = true;

      let value = undefined;
      if (summary) {
        let frmt = summary.format;
        if (frmt) {
          value = format.formatar(frmt, summary.value);
        } else {
          value = summary.value;
        }
        if (summary.align) {
          textConfig.align = summary.align;
        }
        if (summary.color) {
          textConfig.color = summary.color;
        }
      }

      this.texto(textConfig, value, x, y, width);
      this.borda(x, y, width);
    }
  }

  addSummaryTitle() {
    let isTitle = false;

    for (let s of this.variaves.values()) {
      if (s.title) {
        isTitle = true;
        break;
      }
    }

    if (!isTitle) {
      return;
    }

    let p = true;
    let ww = 0;
    let x = 0;
    let y = this.pdfDoc.y;

    for (let column of this.columnHeaderConfig.values()) {
      const width = (this.pageWidth * (column.p / 100));
      const summary = this.variaves.get(column.name);

      if (p) {
        this.pdfDoc.x = 0;
        p = false;
      } else {
        this.pdfDoc.x = ww;
      }

      ww = (this.pdfDoc.x + width);
      x = this.pdfDoc.x;

      let textConfig = new TextConfig(column);
      textConfig.fontBold = true;

      let value = undefined;
      if (summary) {
        if (summary.title) {
          value = summary.title;
        }
        if (summary.align) {
          textConfig.align = summary.align;
        }
        if (summary.color) {
          textConfig.color = summary.color;
        }
      }

      this.texto(textConfig, value, x, y, width);
      this.borda(x, y, width);
    }
  }

  addPageNumber() {
    let range = this.pdfDoc.bufferedPageRange();
    let totalPage = range.count;
    let y = (this.sizePageHeight - (this.margins.top + this.margins.bottom));
    moment.locale('pt_br');
    let date = moment(new Date()).format('D [de] MMMM [de] YYYY, [as] H:mm:ss');

    for (let i = 0; i < totalPage; i++) {
      this.pdfDoc.switchToPage(i);
      this.pdfDoc.y = y;
      this.pdfDoc.x = this.margins.left;
      this.pdfDoc.fillColor('#000000');
      this.pdfDoc.text(`Página ${i + 1} de ${totalPage}          Impressão: ${date}          Usuário: ${this.userName}`);
    }

    this.pdfDoc.flushPages();
  }

  texto(textConfig, text, x, y, width) {
    let h = this.pdfDoc.heightOfString(text, { ...textConfig });

    this.pdfDoc.font(textConfig.getFont())
      .fontSize(textConfig.fontSize)
      .fillColor(textConfig.color)
      .text(
        text,
        x + this.margins.left + this.paddingTextLeft,
        y,
        {
          width: width - this.paddingTextRight,
          height: h,
          ...textConfig
        }
      );
  }

  borda(x, y, w) {
    let h = this.pdfDoc.heightOfString('W');
    this.pdfDoc.lineJoin('miter')
      .lineWidth(0.1)
      .rect(x + this.margins.left, y, w, h + 0.5)
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