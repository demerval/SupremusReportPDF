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
  {
    name: 'valor', title: 'Valor', align: 'right', p: 20, value: (v, config) => {
      if (v > 100 && v < 200) {
        config.color = 'red';
        config.fontBold = true;
        config.align = 'center';
      }

      return { value: v, config: config };
    }
  },
];

const values = [];

for (let i = 0; i < 301; i++) {
  values.push({ razao: 'EMPRESA DE TESTE 01', fantasia: 'TESTE 01', valor: i });
}

report.pageTitle(title);
report.columnHeader(columns);
report.create(values);