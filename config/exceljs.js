require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
require('regenerator-runtime/runtime');

const ExcelJS = require('exceljs/dist/es5');


const exportData = (firstForm, secondForm, thirdForm) => {
  let workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("exp_from_tracker"); 
  worksheet.columns = [
    { header: 'Data Label', key: 'dataLabel', width: 20 },
    { header: 'Data Value', key: 'dataValue', width: 20 }
  ];
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: 'Customer contact details', dataValue: ''});
  worksheet.addRows(firstForm);
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: 'Project details', dataValue: ''});
  worksheet.addRows(secondForm);
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: '', dataValue: ''});
  worksheet.addRow({dataLabel: 'Executive company contact details', dataValue: ''});
  worksheet.addRows(thirdForm);
  return workbook;
};

module.exports = {exportData};