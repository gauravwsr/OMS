import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import './invoice.css'

const PreviousInvoices = () => {
  // API base URL
  const API_BASE_URL = "https://crm-brown-gamma.vercel.app/api";

  // Company information for PDF generation
  const companyInfo = {
    companyName: "TARS TECH",
    streetAddress: "123 Tech Avenue",
    cityStateZip: "NAGPUR, 440010",
    phone: "9111833838",
    terms: "Net 30"
  };

  // State
  const [previousInvoices, setPreviousInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch invoices from API
  const fetchPreviousInvoices = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // Check if data.invoices exists (assuming your API returns data in this structure)
      // Otherwise, use an empty array
      const invoicesArray = Array.isArray(data)
        ? data
        : data && Array.isArray(data.invoices)
        ? data.invoices
        : [];

      setPreviousInvoices(invoicesArray);
      setFilteredInvoices(invoicesArray);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setErrorMessage(`Failed to load invoices: ${error.message}`);

      // Set to empty arrays to prevent errors
      setPreviousInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilteredInvoices(
      query.trim() === ""
        ? previousInvoices
        : previousInvoices.filter((invoice) =>
            invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase())
          )
    );
  };

  // Initialize component
  useEffect(() => {
    fetchPreviousInvoices();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Delete invoice
  const deleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      fetchPreviousInvoices();
      alert("Invoice deleted successfully!");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert(`Error deleting invoice: ${error.message}`);
    }
  };

  // Regenerate PDF from existing invoice
  const regeneratePDF = (invoice) => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");

      // Add company header
      doc.setFontSize(20);
      doc.text(companyInfo.companyName, 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(companyInfo.streetAddress, 105, 25, { align: "center" });
      doc.text(companyInfo.cityStateZip, 105, 30, { align: "center" });
      doc.text(`Phone: ${companyInfo.phone}`, 105, 35, { align: "center" });

      // Add Invoice title
      doc.setFontSize(16);
      doc.text("INVOICE", 105, 45, { align: "center" });

      // Add invoice details
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 15, 60);
      doc.text(`Date: ${formatDate(invoice.date)}`, 15, 65);
      doc.text(`Terms: ${companyInfo.terms}`, 15, 70);

      // Add customer details
      doc.setFontSize(12);
      doc.text("Bill To:", 15, 85);
      doc.setFontSize(10);
      doc.text(invoice.billTo || "N/A", 15, 90);
      doc.text(`Customer ID: ${invoice.customerId || "N/A"}`, 15, 95);
      doc.text(`Contact: ${invoice.contactName || "N/A"}`, 15, 100);
      doc.text(`Phone: ${invoice.contactPhone || "N/A"}`, 15, 105);
      doc.text(`Email: ${invoice.contactEmail || "N/A"}`, 15, 110);

      // Add items table
      const tableColumn = ["Description", "Quantity", "Unit Price", "Amount"];
      const tableRows = invoice.items.map((item) => [
        item.description || "Item",
        item.quantity || 0,
        `Rs.${(item.unitPrice || 0).toFixed(2)}`,
        `Rs.${(item.amount || 0).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 120,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { font: "helvetica", fontSize: 10 },
        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${
              doc.internal.getCurrentPageInfo().pageNumber
            } of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });

      // Add totals
      let finalY = doc.lastAutoTable.finalY + 10;
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.text(`Subtotal: Rs.${invoice.subtotal.toFixed(2)}`, 140, finalY);
      doc.text(
        `GST (${invoice.taxRate}%): Rs.${invoice.tax.toFixed(2)}`,
        140,
        finalY + 5
      );
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total: Rs.${invoice.total.toFixed(2)}`, 140, finalY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Add footer
      doc.setFontSize(8);
      const pageHeight = doc.internal.pageSize.height;
      doc.text("Thank you for your business!", 105, pageHeight - 20, {
        align: "center",
      });

      // Save the PDF
      const fileName = `Invoice_${invoice.invoiceNumber.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  return (
    <div className="invoice-container">
      <div className="invoice-card">
        <div className="header">
          <h1 className="main-title">Invoice Management System</h1>
        </div>

        <div>
          <h2 className="section-title">Previous Invoices</h2>
          <div className="search-section">
            <div className="search-container">
              <div className="search-icon">
                <svg
                  className="search-svg"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                className="search-input"
                placeholder="Search by Invoice Number..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            <div className="refresh-container">
              <button
                onClick={fetchPreviousInvoices}
                className="refresh-button"
                disabled={isLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="refresh-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="error-message">
              <strong>Error: </strong>
              <span>{errorMessage}</span>
              <span className="error-details">
                Please check your server connection and API endpoints.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="no-results">
              {searchQuery
                ? "No invoices match your search criteria."
                : "No invoices found."}
              {!errorMessage && (
                <p className="no-results-hint">
                  {searchQuery
                    ? "Try a different search term."
                    : "Create an invoice to get started."}
                </p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="invoice-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell header-cell">Invoice Number</th>
                    <th className="table-cell header-cell">Date</th>
                    <th className="table-cell header-cell">Client</th>
                    <th className="table-cell header-cell">Total</th>
                    <th className="table-cell header-cell action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="table-row">
                      <td className="table-cell">{invoice.invoiceNumber}</td>
                      <td className="table-cell">{formatDate(invoice.date)}</td>
                      <td className="table-cell">{invoice.billTo}</td>
                      <td className="table-cell">
                        Rs.{invoice.total ? invoice.total.toFixed(2) : "0.00"}
                      </td>
                      <td className="table-cell action-cell">
                        <div className="action-buttons">
                          <button
                            onClick={() => regeneratePDF(invoice)}
                            className="pdf-button"
                            title="Download PDF"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => deleteInvoice(invoice._id)}
                            className="delete-button"
                            title="Delete Invoice"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviousInvoices;