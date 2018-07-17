const fontNormal = __dirname + '/fonts/DejaVuSans.ttf';
const fontBold = __dirname + '/fonts/DejaVuSans-Bold.ttf';

class TextConfig {

  constructor(column) {
    if (column) {
      this.color = column.color ? column.color : '#000000';
      this.align = column.align ? column.align : 'left';
      this.fontBold = column.fontBold ? true : false;
      this.fontSize = column.fontSize ? column.fontSize : 8;
      this.lineGap = column.lineGap ? column.lineGap : 0.5;
      this.lineBreak = column.lineBreak ? column.lineBreak : false;
      this.ellipsis = column.ellipsis ? column.ellipsis : true;
      this.columns = column.columns ? column.columns : 1;
      this.underline = column.underline ? true : false;
    } else {
      this.color = '#000000';
      this.align = 'left';
      this.fontBold = false;
      this.fontSize = 8;
      this.lineGap = 0.5;
      this.lineBreak = false;
      this.ellipsis = true;
      this.columns = 1;
      this.underline = false;
    }
  }

  getFont() {
    if (this.fontBold) {
      return fontBold;
    }

    return fontNormal;
  }
}

module.exports = TextConfig;