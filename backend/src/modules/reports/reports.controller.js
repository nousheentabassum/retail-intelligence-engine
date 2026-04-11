import * as reportsService from "./reports.service.js";

export async function exportReport(req, res, next) {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const report = await reportsService.generateExportReport(startDate, endDate, format);
    
    if (format === 'csv' || format === 'pdf') {
      res.setHeader('Content-Type', report.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.content);
    } else {
      res.json(report);
    }
  } catch (err) {
    next(err);
  }
}
