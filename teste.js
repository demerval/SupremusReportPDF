const ReportPDF = require('./reportPdf');
const FormatoTipo = require('./formatType');

const report = new ReportPDF('rel.pdf', 'DEMERVAL');

const title = [
  { text: 'Relatório de Teste', align: 'center', fontSize: 18 },
  { text: 'Empresa: SUPREMUS TECNOLOGIA' },
  { text: 'Período de: 21/06/2018 Até: 21/06/2018' },
]

const group = {
  config: { name: 'razao' },
  header: {
    fields: [
      { title: 'Informações da empresa:', config: { align: 'right', fontBold: true, fontSize: 6, width: 18 } },
      { name: 'razao', config: { align: 'left', fontBold: true, fontSize: 10, width: 82, underline: true, color: 'green' } }
    ]
  },
  footer: [
    { name: 'fantasia', summary: { type: 'field', fieldName: 'razao', align: 'right', fontBold: true } },
    { name: 'tel1', summary: { title: 'Qtde registros', type: 'count', align: 'right', format: FormatoTipo.NUMBER } },
    { name: 'valor', summary: { title: 'Valor Total', type: 'sum', format: FormatoTipo.DECIMAL_2, color: 'blue', getValue: testeNumeroNegativo } }
  ]
}

const columns = [
  {
    name: 'razao', title: 'Razão Social', p: 35,
    summary: { title: 'Qtde registros', type: 'count', align: 'right', format: FormatoTipo.NUMBER }
  },
  {
    name: 'fantasia', title: 'Nome Fantasia', p: 60
  },
  { name: 'tel1', title: 'Telefone', p: 20 },
  {
    name: 'valor', title: 'Valor', align: 'right', p: 20,
    summary: { title: 'Valor Total', type: 'sum', format: FormatoTipo.DECIMAL_2, color: 'blue' },
    format: FormatoTipo.DECIMAL_2,
    value: (v, config) => {
      if (v > 100 && v < 200) {
        config.color = 'red';
        config.fontBold = true;
      }

      return { value: v, config: config };
    }
  },
];

const columnsGroup = [
  {
    name: 'fantasia', title: 'Nome Fantasia', p: 60
  },
  {
    name: 'tel1', title: 'Telefone', p: 20,
    summary: { title: 'Qtde registros', type: 'count', align: 'right', format: FormatoTipo.NUMBER }
  },
  {
    name: 'valor', title: 'Valor', align: 'right', p: 20, format: FormatoTipo.DECIMAL_2, getValue: testeNumeroNegativo,
    summary: { title: 'Valor Total', type: 'sum', format: FormatoTipo.DECIMAL_2, color: 'blue' }
  },
];

function testeNumeroNegativo(v, config) {
  if (v < 0) {
    config.color = 'red';
    config.fontBold = true;
  }

  return { value: v, config: config };
}

const values = [];

let index = 1;
for (let x = 1; x < 11; x++) {
  for (let i = 1; i < 51; i++) {
    values.push({ razao: `EMPRESA DE TESTE ${x}`, fantasia: `TESTE ${x}`, tel1: `(32)3261-${index}`, valor: x });
    index += 1;
  }
}

report.pageTitle(title);
report.groupConfig(group);
report.columnHeader(columnsGroup);
report.create(values);