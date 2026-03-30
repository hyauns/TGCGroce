import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type {
  RevenueData,
  TopSellingProduct,
  CustomerAcquisition,
  AverageOrderValueTrend,
  ConversionFunnelData,
} from "./analytics"

export interface AnalyticsReportData {
  summary: {
    ordersLast30Days: number
    revenueLast30Days: number
    newCustomersLast30Days: number
    avgOrderValueLast30Days: number
  }
  revenueData: RevenueData[]
  topProducts: TopSellingProduct[]
  customerAcquisition: CustomerAcquisition[]
  aovTrends: AverageOrderValueTrend[]
  funnelData: ConversionFunnelData[]
  dateRange: {
    from: string
    to: string
  }
}

export class AnalyticsPDFExporter {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.pdf = new jsPDF("p", "mm", "a4")
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  private addHeader() {
    // Company logo/title
    this.pdf.setFontSize(24)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text("TCG Store Analytics Report", this.margin, this.currentY)
    this.currentY += 15

    // Date generated
    this.pdf.setFontSize(10)
    this.pdf.setFont("helvetica", "normal")
    this.pdf.text(`Generated on: ${new Date().toLocaleDateString("en-US")}`, this.margin, this.currentY)
    this.currentY += 10

    // Add line separator
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 10
  }

  private addSummarySection(summary: AnalyticsReportData["summary"], dateRange: AnalyticsReportData["dateRange"]) {
    this.pdf.setFontSize(16)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text("Executive Summary", this.margin, this.currentY)
    this.currentY += 10

    this.pdf.setFontSize(10)
    this.pdf.setFont("helvetica", "normal")
    this.pdf.text(
      `Report Period: ${this.formatDate(dateRange.from)} - ${this.formatDate(dateRange.to)}`,
      this.margin,
      this.currentY,
    )
    this.currentY += 10

    // Summary metrics in a grid
    const metrics = [
      { label: "Total Revenue", value: this.formatCurrency(summary.revenueLast30Days) },
      { label: "Total Orders", value: summary.ordersLast30Days.toLocaleString() },
      { label: "New Customers", value: summary.newCustomersLast30Days.toLocaleString() },
      { label: "Avg Order Value", value: this.formatCurrency(summary.avgOrderValueLast30Days) },
    ]

    const colWidth = (this.pageWidth - 2 * this.margin) / 2
    let col = 0

    metrics.forEach((metric, index) => {
      const x = this.margin + col * colWidth

      this.pdf.setFont("helvetica", "bold")
      this.pdf.text(metric.label, x, this.currentY)
      this.pdf.setFont("helvetica", "normal")
      this.pdf.text(metric.value, x, this.currentY + 5)

      col++
      if (col >= 2) {
        col = 0
        this.currentY += 15
      }
    })

    if (col > 0) this.currentY += 15
    this.currentY += 10
  }

  private addTopProductsSection(topProducts: TopSellingProduct[]) {
    this.checkPageBreak(60)

    this.pdf.setFontSize(16)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text("Top Selling Products", this.margin, this.currentY)
    this.currentY += 15

    // Table headers
    const headers = ["Rank", "Product Name", "Category", "Units Sold", "Revenue"]
    const colWidths = [15, 70, 40, 25, 25]
    let x = this.margin

    this.pdf.setFontSize(9)
    this.pdf.setFont("helvetica", "bold")
    headers.forEach((header, index) => {
      this.pdf.text(header, x, this.currentY)
      x += colWidths[index]
    })
    this.currentY += 8

    // Table rows
    this.pdf.setFont("helvetica", "normal")
    topProducts.slice(0, 10).forEach((product, index) => {
      this.checkPageBreak(8)

      x = this.margin
      const rowData = [
        `#${index + 1}`,
        product.name.length > 35 ? product.name.substring(0, 32) + "..." : product.name,
        product.category,
        product.unitsSold.toString(),
        this.formatCurrency(product.revenue),
      ]

      rowData.forEach((data, colIndex) => {
        this.pdf.text(data, x, this.currentY)
        x += colWidths[colIndex]
      })
      this.currentY += 6
    })

    this.currentY += 10
  }

  private addConversionFunnelSection(funnelData: ConversionFunnelData[]) {
    this.checkPageBreak(40)

    this.pdf.setFontSize(16)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text("Conversion Funnel Analysis", this.margin, this.currentY)
    this.currentY += 15

    funnelData.forEach((step) => {
      this.pdf.setFontSize(10)
      this.pdf.setFont("helvetica", "bold")
      this.pdf.text(step.step, this.margin, this.currentY)

      this.pdf.setFont("helvetica", "normal")
      this.pdf.text(
        `${step.count.toLocaleString()} users (${step.conversionRate.toFixed(1)}%)`,
        this.margin + 60,
        this.currentY,
      )

      // Draw progress bar
      const barWidth = 80
      const barHeight = 4
      const fillWidth = (step.conversionRate / 100) * barWidth

      // Background bar
      this.pdf.setFillColor(240, 240, 240)
      this.pdf.rect(this.margin + 120, this.currentY - 2, barWidth, barHeight, "F")

      // Fill bar
      this.pdf.setFillColor(59, 130, 246)
      this.pdf.rect(this.margin + 120, this.currentY - 2, fillWidth, barHeight, "F")

      this.currentY += 8
    })

    this.currentY += 10
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.currentY = this.margin
    }
  }

  private addFooter() {
    const pageCount = this.pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      this.pdf.setFontSize(8)
      this.pdf.setFont("helvetica", "normal")
      this.pdf.text(
        `Page ${i} of ${pageCount} | TCG Store Analytics Report`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" },
      )
    }
  }

  async exportReport(data: AnalyticsReportData): Promise<void> {
    try {
      // Add header
      this.addHeader()

      // Add summary section
      this.addSummarySection(data.summary, data.dateRange)

      // Add top products section
      this.addTopProductsSection(data.topProducts)

      // Add conversion funnel section
      this.addConversionFunnelSection(data.funnelData)

      // Add revenue trends section
      this.checkPageBreak(30)
      this.pdf.setFontSize(16)
      this.pdf.setFont("helvetica", "bold")
      this.pdf.text("Revenue Trends", this.margin, this.currentY)
      this.currentY += 15

      if (data.revenueData.length > 0) {
        this.pdf.setFontSize(10)
        this.pdf.setFont("helvetica", "normal")

        const recentRevenue = data.revenueData.slice(0, 7)
        recentRevenue.forEach((day) => {
          this.pdf.text(
            `${this.formatDate(day.date)}: ${this.formatCurrency(day.revenue)} (${day.orders} orders)`,
            this.margin,
            this.currentY,
          )
          this.currentY += 6
        })
      }

      // Add customer acquisition section
      this.checkPageBreak(30)
      this.currentY += 10
      this.pdf.setFontSize(16)
      this.pdf.setFont("helvetica", "bold")
      this.pdf.text("Customer Acquisition", this.margin, this.currentY)
      this.currentY += 15

      if (data.customerAcquisition.length > 0) {
        this.pdf.setFontSize(10)
        this.pdf.setFont("helvetica", "normal")

        const recentAcquisition = data.customerAcquisition.slice(0, 7)
        recentAcquisition.forEach((day) => {
          this.pdf.text(`${this.formatDate(day.date)}: ${day.newCustomers} new customers`, this.margin, this.currentY)
          this.currentY += 6
        })
      }

      // Add footer
      this.addFooter()

      // Save the PDF
      const fileName = `tcg-analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
      this.pdf.save(fileName)
    } catch (error) {
      console.error("Error generating PDF report:", error)
      throw new Error("Failed to generate PDF report")
    }
  }
}

export async function exportAnalyticsChartToPDF(elementId: string, title: string): Promise<Blob> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`)
    }

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
    })

    const pdf = new jsPDF("p", "mm", "a4")
    const imgWidth = 190
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text(title, 20, 20)

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 30, imgWidth, imgHeight)

    return pdf.output("blob")
  } catch (error) {
    console.error("Error exporting chart to PDF:", error)
    throw new Error("Failed to export chart to PDF")
  }
}
