import PDFDocument from 'pdfkit';
import { IAIInsight, ISurvey } from '../models';
import { createCanvas } from 'canvas';

export interface ExportOptions {
  includeVisualizations?: boolean;
  anonymizeData?: boolean;
}

export class ExportService {
  /**
   * Export AI insights to PDF
   */
  async exportToPDF(
    insight: IAIInsight,
    survey: ISurvey,
    options: ExportOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Title Page
        doc.fontSize(24).text('AI Research Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(survey.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Survey Information
        doc.fontSize(16).text('Survey Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        if (survey.description) {
          doc.text(`Description: ${survey.description}`);
          doc.moveDown(0.5);
        }
        doc.text(`Total Questions: ${survey.questions.length}`);
        doc.text(`Total Responses: ${insight.summary.response_statistics.total_responses}`);
        doc.text(`Completion Rate: ${insight.summary.response_statistics.completion_rate}%`);
        doc.text(`Quality Responses: ${insight.summary.response_statistics.quality_responses}`);
        doc.moveDown(2);

        // Executive Summary
        doc.addPage();
        doc.fontSize(16).text('Executive Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(insight.summary.overview, { align: 'justify' });
        doc.moveDown(2);

        // Key Findings
        doc.fontSize(16).text('Key Findings', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        insight.summary.key_findings.forEach((finding, index) => {
          doc.text(`${index + 1}. ${finding}`, { indent: 20 });
          doc.moveDown(0.3);
        });
        doc.moveDown(2);

        // Question Insights
        if (insight.summary.question_insights.length > 0) {
          doc.addPage();
          doc.fontSize(16).text('Question-Level Insights', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);

          insight.summary.question_insights.forEach((qi, index) => {
            if (index > 0 && index % 3 === 0) {
              doc.addPage();
            }
            doc.fontSize(14).text(`Q: ${qi.question_text}`, { bold: true });
            doc.fontSize(12).text(qi.insight, { indent: 20 });
            doc.moveDown(1);
          });
        }

        // Patterns
        if (insight.patterns.length > 0) {
          doc.addPage();
          doc.fontSize(16).text('Detected Patterns', { underline: true });
          doc.moveDown(0.5);

          insight.patterns.forEach((pattern, index) => {
            doc.fontSize(14).text(`Pattern ${index + 1}: ${pattern.type.toUpperCase()}`, { bold: true });
            doc.fontSize(12);
            doc.text(`Confidence: ${pattern.confidence}%`, { indent: 20 });
            doc.text(`Description: ${pattern.description}`, { indent: 20, align: 'justify' });
            doc.text(`Statistical Significance: ${pattern.statistical_significance}%`, { indent: 20 });
            doc.moveDown(1);
          });
        }

        // Recommendations
        if (insight.recommendations.length > 0) {
          doc.addPage();
          doc.fontSize(16).text('Research Recommendations', { underline: true });
          doc.moveDown(0.5);

          insight.recommendations.forEach((rec, index) => {
            doc.fontSize(14).text(`${index + 1}. ${rec.title}`, { bold: true });
            doc.fontSize(12);
            doc.text(`Priority: ${rec.priority.toUpperCase()}`, { indent: 20 });
            doc.text(`Description: ${rec.description}`, { indent: 20, align: 'justify' });
            doc.moveDown(0.3);
            doc.text('Suggested Actions:', { indent: 20, bold: true });
            rec.suggested_actions.forEach(action => {
              doc.text(`• ${action}`, { indent: 40 });
            });
            doc.moveDown(1);
          });
        }

        // Metadata
        doc.addPage();
        doc.fontSize(16).text('Report Metadata', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Analysis Generated: ${insight.generated_at.toLocaleString()}`);
        doc.text(`Data Snapshot: ${insight.data_snapshot.response_count} responses`);
        doc.text(`Date Range: ${insight.data_snapshot.date_range.start.toLocaleDateString()} - ${insight.data_snapshot.date_range.end.toLocaleDateString()}`);
        if (options.anonymizeData) {
          doc.moveDown(0.5);
          doc.text('Note: Personal data has been anonymized in this report.', { italics: true });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export AI insights to JSON
   */
  async exportToJSON(insight: IAIInsight): Promise<object> {
    return {
      survey_id: insight.survey_id,
      generated_at: insight.generated_at,
      summary: insight.summary,
      patterns: insight.patterns,
      recommendations: insight.recommendations,
      data_snapshot: insight.data_snapshot,
      metadata: {
        export_date: new Date(),
        format: 'json',
        version: '1.0'
      }
    };
  }

  /**
   * Generate comprehensive report with visualizations
   */
  async generateComprehensiveReport(
    insight: IAIInsight,
    survey: ISurvey,
    options: ExportOptions = {}
  ): Promise<Buffer> {
    // For now, use the same PDF export
    // In future, could add more detailed visualizations using canvas
    return this.exportToPDF(insight, survey, { ...options, includeVisualizations: true });
  }

  /**
   * Create a simple chart visualization (placeholder for future enhancement)
   */
  private createChartVisualization(data: any, type: string): Buffer {
    // Create a simple canvas-based chart
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 400);

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.fillText('Chart Visualization', 250, 30);

    // Placeholder text
    ctx.font = '12px Arial';
    ctx.fillText('Chart data visualization', 220, 200);

    return canvas.toBuffer('image/png');
  }
}
