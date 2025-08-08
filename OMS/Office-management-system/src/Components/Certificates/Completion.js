import React, { useState } from "react";
import "./Certificate.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";

const Completion = () => {
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

  // Initial state for completion certificate data
  const initialCompletionData = {
    participantName: "",
    instituteName: "",
    courseType: "Web Development Course",
    completionType: "Course",
    organizationName: "TARS Technologies",
    startDate: "",
    endDate: "",
    certID: "",
    issueDate: "",
    instructorName: "Sumedh Boudh",
    instructorTitle: "Lead Instructor",
    organizationTitle: "TARS Technologies",
    logoUrl: "/images/1.png",
    stampUrl: "/Images/Screenshot 2025-03-31 180904.png",
    signatureUrl: "/api/placeholder/150/60",
    duration: "3 Months",
    grade: "A+",
    // Input versions of dates for the date pickers
    startDateInput: "",
    endDateInput: "",
    issueDateInput: "",
  };

  const [completionData, setCompletionData] = useState(initialCompletionData);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle date changes
  const handleDateChange = (field, value) => {
    setCompletionData((prev) => ({
      ...prev,
      [field]: formatDisplayDate(value),
      [`${field}Input`]: value,
    }));
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "participantName",
        "instituteName",
        "startDate",
        "endDate",
        "certID",
        "issueDate",
      ];

      const missingFields = requiredFields.filter(
        (field) => !completionData[field]
      );

      if (missingFields.length > 0) {
        throw new Error("Please fill all required fields");
      }

      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login.");
      }

      // Save to database via API (you can create a separate completion API endpoint)
      const response = await fetch(
        "http://146.190.165.62:5000/api/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participantName: completionData.participantName,
            instituteName: completionData.instituteName,
            courseType: completionData.courseType,
            organizationName: completionData.organizationName,
            startDate: completionData.startDate,
            endDate: completionData.endDate,
            certID: completionData.certID,
            issueDate: completionData.issueDate,
            instructorName: completionData.instructorName,
            instructorTitle: completionData.instructorTitle,
            organizationTitle: completionData.organizationTitle,
            duration: completionData.duration,
            grade: completionData.grade,
          }),
        }
      );

      let result = {};
      if (response.ok) {
        result = await response.json();
      }

      // Save to local storage for backward compatibility
      const timestamp = new Date().toISOString();
      const completionWithTimestamp = {
        ...completionData,
        createdAt: timestamp,
        _id: result.completion?._id || Date.now().toString(),
      };

      const existingCompletions = JSON.parse(
        localStorage.getItem("completions") || "[]"
      );

      localStorage.setItem(
        "completions",
        JSON.stringify([...existingCompletions, completionWithTimestamp])
      );

      setIsSaved(true);
      setTimeout(() => {
        setCompletionData(initialCompletionData);
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Download completion certificate as PDF
  const downloadCompletion = async () => {
    try {
      // Basic validation
      if (!completionData.participantName) {
        setError("Please enter Participant Name before downloading");
        return;
      }

      if (!completionData.certID) {
        setError("Please enter Certificate ID before downloading");
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log("Starting completion certificate generation...");

      // Create completion certificate element in memory
      const completionHTML = `
        <div id="completion-for-download" style="
          width: 1200px;
          height: 850px;
          background: white;
          padding: 60px;
          position: relative;
          font-family: 'Times New Roman', serif;
          box-sizing: border-box;
          border: 4px solid #10b981;
        ">
          <!-- Completion Certificate Content -->
          <div style="text-align: center; height: 100%; padding: 40px;">
            
            <!-- Title -->
            <h1 style="
              font-size: 48px;
              color: #10b981;
              margin: 40px 0;
              font-weight: bold;
              letter-spacing: 3px;
              text-transform: uppercase;
            ">CERTIFICATE OF COMPLETION</h1>

            <!-- Intro text -->
            <p style="
              font-size: 20px;
              font-style: italic;
              color: #10b981;
              margin: 30px 0;
            ">This is to certify that</p>

            <!-- Participant Name -->
            <h2 style="
              font-size: 42px;
              color: #10b981;
              margin: 30px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            ">${completionData.participantName}</h2>

            <!-- Description -->
            <p style="
              font-size: 18px;
              color: #333;
              margin: 25px 0;
              line-height: 1.6;
              max-width: 800px;
              margin-left: auto;
              margin-right: auto;
            ">has successfully completed the ${completionData.duration} ${
        completionData.courseType
      }</p>
            <p style="
              font-size: 18px;
              color: #333;
              margin: 15px 0;
              line-height: 1.6;
            ">conducted by <strong>${
              completionData.organizationName
            }</strong></p>
            <p style="
              font-size: 16px;
              color: #333;
              margin: 15px 0;
              line-height: 1.6;
            ">with grade: <strong style="color: #10b981;">${
              completionData.grade
            }</strong></p>

            <!-- Footer Section -->
            <div style="
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              align-items: end;
              padding: 0 40px;
            ">
              <!-- Left Side - Details -->
              <div style="text-align: left; flex: 1;">
                <p style="margin: 4px 0; font-weight: bold; font-size: 14px; color: #333;">${completionData.organizationName.toUpperCase()} COURSE</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Professional Training Program</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Cert. I.D.: ${
                  completionData.certID
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Completed: ${
                  completionData.issueDate || new Date().toLocaleDateString()
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Duration: ${
                  completionData.startDate
                } to ${completionData.endDate}</p>
              </div>

              <!-- Center - Certified Stamp -->
              <div style="text-align: center; flex: 0 0 120px; margin: 0 20px;">
                <div style="
                  width: 80px;
                  height: 80px;
                  border: 3px solid #10b981;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto;
                  background: white;
                ">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #10b981; font-weight: bold;">COMPLETED</div>
                    <div style="font-size: 8px; color: #10b981; margin-top: 2px;">GRADE: ${
                      completionData.grade
                    }</div>
                  </div>
                </div>
              </div>

              <!-- Right Side - Signature -->
              <div style="text-align: center; flex: 1;">
                <div style="
                  border-bottom: 2px solid #333;
                  width: 150px;
                  margin: 0 auto 15px auto;
                  height: 30px;
                "></div>
                <p style="margin: 4px 0; font-weight: bold; font-size: 14px; color: #333;">${
                  completionData.instructorName || "Sumedh Boudh"
                }</p>
                <p style="margin: 4px 0; font-size: 12px; font-style: italic; color: #333;">${
                  completionData.instructorTitle || "Lead Instructor"
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">${
                  completionData.organizationName
                }</p>
              </div>
            </div>
          </div>
        </div>
      `;

      console.log("Creating temporary DOM element...");

      // Create temporary element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = completionHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "1200px";
      tempDiv.style.height = "850px";
      document.body.appendChild(tempDiv);

      const completionElement = tempDiv.querySelector(
        "#completion-for-download"
      );

      if (!completionElement) {
        throw new Error("Could not create completion certificate element");
      }

      console.log("Generating canvas from completion certificate element...");

      // Generate certificate image and PDF
      const canvas = await html2canvas(completionElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 1200,
        height: 850,
        logging: true,
      });

      console.log("Canvas generated, creating PDF...");

      const imgData = canvas.toDataURL("image/png");

      // Create PDF
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

      // Download PDF
      const fileName = `${completionData.participantName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}-completion-${completionData.certID.replace(/[^a-z0-9]/gi, "_")}.pdf`;

      console.log("Saving PDF as:", fileName);
      pdf.save(fileName);

      // Try to save to database (but don't fail if it doesn't work)
      try {
        const token = localStorage.getItem("token");
        if (token) {
          console.log("Attempting to save completion to database...");
          const response = await fetch(
            "http://146.190.165.62:5000/api/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                participantName: completionData.participantName,
                instituteName: completionData.instituteName || "Institute Name",
                courseType: completionData.courseType,
                organizationName: completionData.organizationName,
                startDate: completionData.startDate || "Start Date",
                endDate: completionData.endDate || "End Date",
                certID: completionData.certID,
                issueDate:
                  completionData.issueDate || new Date().toLocaleDateString(),
                instructorName: completionData.instructorName,
                instructorTitle: completionData.instructorTitle,
                organizationTitle: completionData.organizationTitle,
                duration: completionData.duration,
                grade: completionData.grade,
                certificateImageData: imgData,
              }),
            }
          );

          if (response.ok) {
            console.log(
              "Completion certificate saved to database successfully"
            );
          } else {
            const result = await response.json();
            console.warn(
              "Could not save completion to database:",
              result.message
            );
          }
        }
      } catch (dbError) {
        console.warn(
          "Database save failed (continuing anyway):",
          dbError.message
        );
      }

      // Remove temporary element
      document.body.removeChild(tempDiv);

      console.log("Completion certificate download completed successfully!");
    } catch (error) {
      console.error("Error generating completion certificate:", error);
      setError(
        `Error generating completion certificate: ${error.message}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="certificate-page">
      <div className="certificate-container">
        {/* Admin Panel */}
        <div className="admin-panel">
          <h3>Completion Certificate Data Input</h3>

          {isSaved && (
            <div className="save-message">
              Completion certificate data saved successfully!
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label required>Participant Name:</label>
              <input
                type="text"
                value={completionData.participantName}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    participantName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label required>Institute/College Name:</label>
              <input
                type="text"
                value={completionData.instituteName}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    instituteName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Course Type:</label>
              <select
                value={completionData.courseType}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    courseType: e.target.value,
                  })
                }
              >
                {[
                  "Web Development Course",
                  "UI/UX Design Course",
                  "Cloud Computing Course",
                  "DevOps Training",
                  "IoT Development Course",
                  "Digital Marketing Course",
                  "Data Science Course",
                  "Mobile App Development",
                  "Cybersecurity Course",
                  "Machine Learning Course",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Duration:</label>
              <select
                value={completionData.duration}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    duration: e.target.value,
                  })
                }
              >
                {[
                  "1 Month",
                  "2 Months",
                  "3 Months",
                  "4 Months",
                  "5 Months",
                  "6 Months",
                  "1 Year",
                ].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Grade:</label>
              <select
                value={completionData.grade}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    grade: e.target.value,
                  })
                }
              >
                {[
                  "A+",
                  "A",
                  "A-",
                  "B+",
                  "B",
                  "B-",
                  "C+",
                  "C",
                  "Pass",
                  "Excellent",
                  "Good",
                  "Satisfactory",
                ].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Organization Name:</label>
              <select
                value={completionData.organizationName}
                onChange={(e) => {
                  if (e.target.value === "OTHER") {
                    const customOrg = prompt("Enter organization name:");
                    if (customOrg) {
                      setCompletionData({
                        ...completionData,
                        organizationName: customOrg,
                      });
                    }
                  } else {
                    setCompletionData({
                      ...completionData,
                      organizationName: e.target.value,
                    });
                  }
                }}
              >
                {["TARS Technologies", "BANE", "Tech Academy", "OTHER"].map(
                  (org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label required>Start Date:</label>
              <input
                type="date"
                value={completionData.startDateInput}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                required
              />
              {completionData.startDate && (
                <div className="date-display">{completionData.startDate}</div>
              )}
            </div>

            <div className="form-group">
              <label required>End Date:</label>
              <input
                type="date"
                value={completionData.endDateInput}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                required
              />
              {completionData.endDate && (
                <div className="date-display">{completionData.endDate}</div>
              )}
            </div>

            <div className="form-group">
              <label required>Certificate ID:</label>
              <input
                type="text"
                value={completionData.certID}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
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
                value={completionData.issueDateInput}
                onChange={(e) => handleDateChange("issueDate", e.target.value)}
                required
              />
              {completionData.issueDate && (
                <div className="date-display">{completionData.issueDate}</div>
              )}
            </div>

            <div className="form-group">
              <label>Instructor Name:</label>
              <input
                type="text"
                value={completionData.instructorName}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    instructorName: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Instructor Title:</label>
              <input
                type="text"
                value={completionData.instructorTitle}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    instructorTitle: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="button-container">
            <button
              onClick={handleSave}
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Completion Data"}
            </button>

            <button
              onClick={() => navigate("/completion-history")}
              className="history-button"
            >
              View Completion History
            </button>

            <button
              onClick={downloadCompletion}
              className="download-button"
              disabled={
                !completionData.participantName || !completionData.certID
              }
            >
              {isLoading ? "Generating..." : "Download Certificate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Completion;
