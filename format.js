const Tipo = require('./formatType');

const Format = {

  formatar(tipo, value) {
    switch (tipo) {
      case Tipo.DECIMAL_2:
        return this.formatMoeda(value);
      case Tipo.DECIMAL_3:
        return this.formatPeso(value);
      case Tipo.DECIMAL_4:
        return this.formatNumeroDecimal(value, 4);
      default:
        if (typeof value !== 'string') {
          value = String(value);
        }
        var f = parseFloat(value);
        return this.formatNumero(f);
    }
  },

  formatMoeda(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    var f = parseFloat(value).toFixed(2);
    return this.formatNumero(f);
  },

  formatPeso(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    var f = parseFloat(value).toFixed(3);
    return this.formatNumero(f);
  },

  formatNumeroDecimal(str, decimais) {
    if (typeof str !== 'string') {
      str = String(str);
    }
    var f = parseFloat(str).toFixed(decimais);
    return this.formatNumero(f);
  },

  formatNumero(str) {
    var parts = (str + "").split("."),
      main = parts[0],
      len = main.length,
      output = "",
      first = main.charAt(0),
      i;

    if (first === '-') {
      main = main.slice(1);
      len = main.length;
    } else {
      first = "";
    }
    i = len - 1;
    while (i >= 0) {
      output = main.charAt(i) + output;
      if ((len - i) % 3 === 0 && i > 0) {
        output = "." + output;
      }
      --i;
    }
    // put sign back
    output = first + output;
    // put decimal part back
    if (parts.length > 1) {
      output += "," + parts[1];
    }
    return output;
  }



}

module.exports = Format;