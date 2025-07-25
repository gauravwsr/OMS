import React, { useState } from "react";
import "./Certificate.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";

const Certificate = () => {
  const navigate = useNavigate();

  // Helper function to format date from YYYY-MM-DD to "1st March 2023"
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    // Add ordinal suffix
    let suffix;
    if (day > 3 && day < 21) suffix = "th";
    else {
      switch (day % 10) {
        case 1:
          suffix = "st";
          break;
        case 2:
          suffix = "nd";
          break;
        case 3:
          suffix = "rd";
          break;
        default:
          suffix = "th";
      }
    }

    return `${day}${suffix} ${month} ${year}`;
  };

  // Initial state for certificate data
  const initialCertificateData = {
    studentName: "",
    collegeName: "",
    internshipType: "Social Media Marketing",
    certificateType: "Type1",
    companyName: "TARS Technologies",
    startDate: "",
    endDate: "",
    certID: "",
    issueDate: "",
    directorName: "Sumedh Boudh",
    directorTitle: "Director",
    companyTitle: "TARS Technologies",
    logoUrl: "/images/1.png",
    stampUrl: "/Images/Screenshot 2025-03-31 180904.png",
    signatureUrl: "/api/placeholder/150/60",
    // Input versions of dates for the date pickers
    startDateInput: "",
    endDateInput: "",
    issueDateInput: "",
  };

  const [certificateData, setCertificateData] = useState(
    initialCertificateData
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle date changes
  const handleDateChange = (field, value) => {
    setCertificateData((prev) => ({
      ...prev,
      [field]: formatDisplayDate(value),
      [`${field}Input`]: value,
    }));
  };

  // Handle save button click
  const handleSave = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "studentName",
        "collegeName",
        "startDate",
        "endDate",
        "certID",
        "issueDate",
      ];

      const missingFields = requiredFields.filter(
        (field) => !certificateData[field]
      );

      if (missingFields.length > 0) {
        throw new Error("Please fill all required fields");
      }

      // Save to local storage
      const timestamp = new Date().toISOString();
      const certificateWithTimestamp = {
        ...certificateData,
        createdAt: timestamp,
      };

      const existingCertificates = JSON.parse(
        localStorage.getItem("certificates") || "[]"
      );

      localStorage.setItem(
        "certificates",
        JSON.stringify([...existingCertificates, certificateWithTimestamp])
      );

      setIsSaved(true);
      setTimeout(() => {
        setCertificateData(initialCertificateData);
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Certificate templates
  const certificateTemplates = {
    Type1: (
      <div id="certificate-for-download" className="certificate type1">
        {/* <div className="certificate-border"></div> */}
        <div className="certificate-content">
          <div className="certificate-header">
            <div className="certificate-logo">
              <img src={certificateData.logoUrl} alt="Company Logo" />
            </div>
            <h1 className="certificate-title">CERTIFICATE OF INTERNSHIP</h1>
          </div>

          <div className="certificate-body">
            <p className="certificate-intro">This is to certify that</p>
            <h2 className="certificate-name">{certificateData.studentName}</h2>
            <p className="certificate-text">
              For successfully completing the {certificateData.internshipType}{" "}
              internship program at {certificateData.companyName} from{" "}
              {certificateData.startDate} to {certificateData.endDate}.
            </p>
            <p className="certificate-text">
              This achievement demonstrates dedication, hard work, and
              professional growth in the field.
            </p>
          </div>

          <div className="certificate-footer">
            <div className="signature-block">
              <div className="signature-image">
                <img src={certificateData.signatureUrl} alt="Signature" />
              </div>
              <div className="signature-line"></div>
              <p className="signature-name">
                {certificateData.directorName}
                <br />
                {certificateData.directorTitle}
                <br />
                {certificateData.companyName}
              </p>
            </div>
            <div className="certificate-id">
              Certificate ID: {certificateData.certID}
              <br />
              Issued on: {certificateData.issueDate}
            </div>
          </div>
        </div>
      </div>
    ),

    Type2: (
      <div id="certificate-for-download" className="certificate type2">
        {/* <div className="certificate-border"></div> */}
        <div className="certificate-content">
          <div className="certificate-header">
            <div className="certificate-logo">
              <img src={certificateData.logoUrl} alt="Company Logo" />
            </div>
            <h1 className="certificate-title">ACHIEVEMENT CERTIFICATE</h1>
          </div>

          <div className="certificate-body">
            <p className="certificate-intro">
              This certificate is proudly presented to
            </p>
            <h2 className="certificate-name">{certificateData.studentName}</h2>
            <p className="certificate-text">
              For successfully completing the {certificateData.internshipType}{" "}
              internship program at {certificateData.companyName} from{" "}
              {certificateData.startDate} to {certificateData.endDate}.
            </p>
            <p className="certificate-text">
              This achievement demonstrates dedication, hard work, and
              professional growth in the field.
            </p>
          </div>

          <div className="certificate-footer">
            <div className="signature-block">
              <div className="signature-image">
                <img src={certificateData.signatureUrl} alt="Signature" />
              </div>
              <div className="signature-line"></div>
              <p className="signature-name">
                {certificateData.directorName}
                <br />
                {certificateData.directorTitle}
                <br />
                {certificateData.companyName}
              </p>
            </div>
            <div className="certificate-id">
              Certificate ID: {certificateData.certID}
              <br />
              Issued on: {certificateData.issueDate}
            </div>
          </div>
        </div>
      </div>
    ),
    Type3: (
      <div id="certificate-for-download" className="certificate type3">
        {/* <div className="certificate-border"></div> */}
        <div className="certificate-content">
          <div className="certificate-header">
            <div className="certificate-logo">
              <img src={certificateData.logoUrl} alt="Company Logo" />
            </div>
            <h1 className="certificate-title">ACHIEVEMENT CERTIFICATE</h1>
          </div>

          <div className="certificate-body">
            <p className="certificate-intro">
              This certificate is proudly presented to
            </p>
            <h2 className="certificate-name">{certificateData.studentName}</h2>
            <p className="certificate-text">
              For successfully completing the {certificateData.internshipType}{" "}
              internship program at {certificateData.companyName} from{" "}
              {certificateData.startDate} to {certificateData.endDate}.
            </p>
            <p className="certificate-text">
              This achievement demonstrates dedication, hard work, and
              professional growth in the field.
            </p>
          </div>

          <div className="certificate-footer">
            <div className="signature-block">
              <div className="signature-image">
                <img src={certificateData.signatureUrl} alt="Signature" />
              </div>
              <div className="signature-line"></div>
              <p className="signature-name">
                {certificateData.directorName}
                <br />
                {certificateData.directorTitle}
                <br />
                {certificateData.companyName}
              </p>
            </div>
            <div className="certificate-id">
              Certificate ID: {certificateData.certID}
              <br />
              Issued on: {certificateData.issueDate}
            </div>
          </div>
        </div>
      </div>
    ),
  };

  // Download certificate as PDF
  const downloadCertificate = () => {
    const certificateElement = document.getElementById(
      "certificate-for-download"
    );

    html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [297, 210],
      });

      const imgWidth = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = 10;
      const y = (210 - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(
        `${certificateData.studentName || "Certificate"}-${
          certificateData.certID || "ID"
        }.pdf`
      );
    });
  };

  return (
    <div className="certificate-page">
      <div className="certificate-container">
        {/* Admin Panel */}
        <div className="admin-panel">
          <h3>Certificate Data Input</h3>

          {isSaved && (
            <div className="save-message">
              Certificate data saved successfully!
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label required>Student Name:</label>
              <input
                type="text"
                value={certificateData.studentName}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    studentName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label required>College Name:</label>
              <input
                type="text"
                value={certificateData.collegeName}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    collegeName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Internship Type:</label>
              <select
                value={certificateData.internshipType}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    internshipType: e.target.value,
                  })
                }
              >
                {[
                  "Web Development",
                  "UI/UX",
                  "Cloud Computing",
                  "DevOps",
                  "IoT",
                  "Social Media Marketing",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Certificate Type:</label>
              <select
                value={certificateData.certificateType}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    certificateType: e.target.value,
                  })
                }
              >
                {["Type1", "Type2", "Type3"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            

            <div className="form-group">
              <label>Company Name:</label>
              <select
                value={certificateData.companyName}
                onChange={(e) => {
                  if (e.target.value === "OTHER") {
                    const customCompany = prompt("Enter company name:");
                    if (customCompany) {
                      setCertificateData({
                        ...certificateData,
                        companyName: customCompany,
                      });
                    }
                  } else {
                    setCertificateData({
                      ...certificateData,
                      companyName: e.target.value,
                    });
                  }
                }}
              >
                {["TARS Technologies", "BANE", "OTHER"].map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label required>Start Date:</label>
              <input
                type="date"
                value={certificateData.startDateInput}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                required
              />
              {certificateData.startDate && (
                <div className="date-display">{certificateData.startDate}</div>
              )}
            </div>

            <div className="form-group">
              <label required>End Date:</label>
              <input
                type="date"
                value={certificateData.endDateInput}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                required
              />
              {certificateData.endDate && (
                <div className="date-display">{certificateData.endDate}</div>
              )}
            </div>

            <div className="form-group">
              <label required>Certificate ID:</label>
              <input
                type="text"
                value={certificateData.certID}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    certID: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label required>Issue Date:</label>
              <input
                type="date"
                value={certificateData.issueDateInput}
                onChange={(e) => handleDateChange("issueDate", e.target.value)}
                required
              />
              {certificateData.issueDate && (
                <div className="date-display">{certificateData.issueDate}</div>
              )}
            </div>
          </div>

          <div className="button-container">
            <button
              onClick={handleSave}
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Certificate Data"}
            </button>

            <button
              onClick={() => navigate("Storage")}
              className="history-button"
            >
              View Certificate History
            </button>
          </div>
        </div>

        {/* Download Button */}
        <div className="download-button-container">
          <button
            onClick={downloadCertificate}
            className="download-button"
            disabled={!certificateData.studentName || !certificateData.certID}
          >
            Download Certificate
          </button>
        </div>

        {/* Certificate Preview */}
        {certificateTemplates[certificateData.certificateType]}
      </div>
    </div>
  );
};

export default Certificate;