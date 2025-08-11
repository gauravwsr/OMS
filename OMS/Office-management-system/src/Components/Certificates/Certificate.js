import React, { useState, useEffect } from "react";
import "./Certificate.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";

const Certificate = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("internship"); // "internship", "completion", or "offer"
  const [showCertificateHistory, setShowCertificateHistory] = useState(false);
  const [showCompletionHistory, setShowCompletionHistory] = useState(false);
  const [showOfferHistory, setShowOfferHistory] = useState(false);

  const [certificateHistory, setCertificateHistory] = useState([]);
  const [completionHistory, setCompletionHistory] = useState([]);
  const [offerHistory, setOfferHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  // Add test function to check existing certificates
  const checkExistingCertificates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No auth token found");
        return;
      }

      console.log("Checking existing certificates...");
      const response = await fetch("http://146.190.165.62:5001/api/certificates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Existing certificates:", data);
        console.log("Total certificates:", data.certificates?.length || 0);

        if (data.certificates && data.certificates.length > 0) {
          console.log(
            "Certificate IDs in database:",
            data.certificates.map((cert) => cert.certID)
          );
        }
      } else {
        const errorData = await response.json();
        console.log("Error fetching certificates:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };

  // Add test function for authentication
  const testAuthentication = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("=== AUTHENTICATION TEST ===");
      console.log("Token exists:", !!token);
      console.log(
        "Token format:",
        token ? (token.length > 20 ? "Valid length" : "Too short") : "No token"
      );

      if (!token) {
        console.log("❌ No token found - User needs to login");
        setError("Please login to access this feature");
        return false;
      }

      // Test with a simple endpoint
      console.log("Testing authentication with offers endpoint...");
      const response = await fetch("http://146.190.165.62:5001/api/offers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Auth test response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Authentication successful");
        console.log("User has access to offers:", data);
        return true;
      } else {
        const errorData = await response.json();
        console.log("❌ Authentication failed:", errorData);
        setError(`Authentication failed: ${errorData.message}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Authentication test error:", error);
      setError(`Authentication error: ${error.message}`);
      return false;
    }
  };

  // Call this function when component mounts
  useEffect(() => {
    checkExistingCertificates();
    testAuthentication();
  }, []);

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
    candidateName: "",
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

  // Initial state for completion certificate data
  const initialCompletionData = {
    candidateName: "",
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

  // Initial state for offer letter data
  const initialOfferData = {
    candidateName: "",
    position: "Software Developer",
    department: "Technology",
    joiningDate: "",
    salary: "",
    companyName: "TARS Technologies",
    companyAddress: "123 Tech Street, Innovation City",
    hrName: "Sarah Johnson",
    hrTitle: "HR Manager",
    offerID: "",
    issueDate: "",
    validUntil: "",
    workLocation: "Hybrid",
    employmentType: "Full-time",
    probationPeriod: "3 Months",
    // Input versions of dates for the date pickers
    joiningDateInput: "",
    issueDateInput: "",
    validUntilInput: "",
  };

  const [certificateData, setCertificateData] = useState(
    initialCertificateData
  );
  const [completionData, setCompletionData] = useState(initialCompletionData);
  const [offerData, setOfferData] = useState(initialOfferData);
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
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "candidateName",
        "collegeName",
        "internshipType",
        "companyName",
        "startDate",
        "endDate",
        "certID",
        "issueDate",
      ];

      const missingFields = requiredFields.filter(
        (field) => !certificateData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(
          "Please fill all required fields: " + missingFields.join(", ")
        );
      }

      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login.");
      }

      console.log(
        "Attempting to save certificate with ID:",
        certificateData.certID
      );

      // Save to database via API
      const response = await fetch("http://146.190.165.62:5001/api/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateName: certificateData.candidateName,
          collegeName: certificateData.collegeName,
          internshipType: certificateData.internshipType,
          companyName: certificateData.companyName,
          startDate: certificateData.startDate,
          endDate: certificateData.endDate,
          certID: certificateData.certID,
          issueDate: certificateData.issueDate,
        }),
      });

      console.log("Server response status:", response.status);

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to save certificate");
      }

      // Also save to local storage for backward compatibility
      const timestamp = new Date().toISOString();
      const certificateWithTimestamp = {
        ...certificateData,
        createdAt: timestamp,
        _id: result.certificate._id,
      };

      const existingCertificates = JSON.parse(
        localStorage.getItem("certificates") || "[]"
      );

      localStorage.setItem(
        "certificates",
        JSON.stringify([...existingCertificates, certificateWithTimestamp])
      );

      setIsSaved(true);
      
      // Refresh certificate history if it's currently being shown
      if (showCertificateHistory) {
        fetchCertificateHistory();
      }
      
      setTimeout(() => {
        setCertificateData(initialCertificateData);
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      console.error("Certificate save error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  //View History certificates - Database Based
  const fetchCertificateHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found for fetching certificate history");
        setCertificateHistory([]);
        return;
      }

      // Fetch all certificates from database
      const response = await fetch("http://146.190.165.62:5001/api/certificates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("📋 Fetching certificate history from database:", result);
        setCertificateHistory(result.certificates || []);
      } else {
        console.error("Failed to fetch certificate history");
        setCertificateHistory([]);
      }
    } catch (error) {
      console.error("Error fetching certificate history:", error);
      setCertificateHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCertificateHistoryToggle = () => {
  if (!showCertificateHistory) {
    fetchCertificateHistory();
  }
  setShowCertificateHistory(!showCertificateHistory);
};

const handleCompletionHistoryToggle = () => {
  if (!showCompletionHistory) {
    fetchCompletionHistory();
  }
  setShowCompletionHistory(!showCompletionHistory);
};

const handleOfferHistoryToggle = () => {
  if (!showOfferHistory) {
    fetchOfferHistory();
  }
  setShowOfferHistory(!showOfferHistory);
};

  // Download certificate as PDF
  const downloadCertificate = async () => {
    try {
      // Basic validation
      if (!certificateData.candidateName) {
        setError("Please enter Candidate Name before downloading");
        return;
      }

      if (!certificateData.certID) {
        setError("Please enter Certificate ID before downloading");
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log("Starting certificate generation...");

      // Create certificate element in memory (not displayed on screen)
      const certificateHTML = `
        <div id="certificate-for-download" style="
          width: 1200px;
          height: 850px;
          background: white;
          padding: 60px;
          position: relative;
          font-family: 'Times New Roman', serif;
          box-sizing: border-box;
          border: 20px solid #0891b2;
        ">
          <!-- Certificate Content -->
          <div style="text-align: center; height: 100%; padding: 40px;">
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
            ">Image</div>
            <!-- Title -->
            <h1 style="
              font-size: 48px;
              color: #0891b2;
              margin: 40px 0;
              font-weight: bold;
              letter-spacing: 3px;
              text-transform: uppercase;
            ">CERTIFICATE OF INTERNSHIP</h1>

            <!-- Intro text -->
            <p style="
              font-size: 20px;
              font-style: italic;
              color: #0891b2;
              margin: 30px 0;
            ">This is to certify that</p>

            <!-- Student Name -->
            <h2 style="
              font-size: 42px;
              color: #0891b2;
              margin: 30px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            ">${certificateData.candidateName}</h2>

            <!-- Description -->
            <p style="
              font-size: 18px;
              color: #333;
              margin: 25px 0;
              line-height: 1.6;
              max-width: 800px;
              margin-left: auto;
              margin-right: auto;
            ">has successfully completed a 5 Month internship in ${
              certificateData.internshipType ||
              "Digital Marketing & Sales Marketing"
            }</p>
            <p style="
              font-size: 18px;
              color: #333;
              margin: 15px 0;
              line-height: 1.6;
              margin-top: -17px;
            ">with <strong>TARS Technologies</strong>.</p>

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
                <p style="margin: 4px 0; font-weight: bold; font-size: 14px; color: #333;">TARS TECHNOLOGIES INTERNSHIP</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Academic Credits with Industry Mentors</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Cert. I.D.: ${
                  certificateData.certID
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">Dated: ${
                  certificateData.issueDate || new Date().toLocaleDateString()
                }</p>
              </div>

              <!-- Center - Certified Stamp -->
              <div style="text-align: center; flex: 0 0 120px; margin: 0 20px;">
                <div style="
                  width: 80px;
                  height: 80px;
                  border: 3px solid #e74c3c;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto;
                  background: white;
                ">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #e74c3c; font-weight: bold;">CERTIFIED</div>
                    <div style="font-size: 8px; color: #e74c3c; margin-top: 2px;">CERTIFIED</div>
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
                  certificateData.directorName || "Sumedh Boudh"
                }</p>
                <p style="margin: 4px 0; font-size: 12px; font-style: italic; color: #333;">${
                  certificateData.directorTitle || "Director"
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #333;">TARS Technologies</p>
              </div>
            </div>
          </div>
        </div>
      `;

      console.log("Creating temporary DOM element...");

      // Create temporary element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = certificateHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "1200px";
      tempDiv.style.height = "850px";
      document.body.appendChild(tempDiv);

      const certificateElement = tempDiv.querySelector(
        "#certificate-for-download"
      );

      if (!certificateElement) {
        throw new Error("Could not create certificate element");
      }

      console.log("Generating canvas from certificate element...");

      // Generate certificate image and PDF
      const canvas = await html2canvas(certificateElement, {
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
      const fileName = `${certificateData.candidateName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}-${certificateData.certID.replace(/[^a-z0-9]/gi, "_")}.pdf`;

      console.log("Saving PDF as:", fileName);
      pdf.save(fileName);

      // Remove temporary element
      document.body.removeChild(tempDiv);

      console.log("Certificate download completed successfully!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      setError(
        `Error generating certificate: ${error.message}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completion date changes
  // Handle completion date changes
  const handleCompletionDateChange = (field, value) => {
    setCompletionData((prev) => {
      const updatedData = {
        ...prev,
        [field]: formatDisplayDate(value),
        [`${field}Input`]: value,
      };

      // Automatically calculate end date based on duration
      if (field === "startDate" && completionData.duration) {
        const durationInMonths = parseInt(
          completionData.duration.split(" ")[0],
          10
        ); // Extract the number from "3 Months"
        if (!isNaN(durationInMonths)) {
          const startDate = new Date(value);
          const endDate = new Date(
            startDate.setMonth(startDate.getMonth() + durationInMonths)
          );
          updatedData.endDate = formatDisplayDate(
            endDate.toISOString().split("T")[0]
          );
          updatedData.endDateInput = endDate.toISOString().split("T")[0];
        }
      }

      return updatedData;
    });
  };

  // Handle save button click for completion
  const handleCompletionSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "candidateName",
        "courseType",
        "organizationName",
        "duration",
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

      // Save to database via API - FIXED
      const response = await fetch("http://146.190.165.62:5001/api/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateName: completionData.candidateName,
          courseType: completionData.courseType,
          organizationName: completionData.organizationName,
          startDate: completionData.startDate,
          endDate: completionData.endDate,
          certID: completionData.certID,
          issueDate: completionData.issueDate,
          duration: completionData.duration,
        }),
      });

      // FIXED - Only read response once
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save completion certificate"
        );
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
      
      // Refresh completion history if it's currently being shown
      if (showCompletionHistory) {
        fetchCompletionHistory();
      }
      
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

  // View Completion History - Database Based
  const fetchCompletionHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found for fetching completion history");
        setCompletionHistory([]);
        return;
      }

      // Fetch all completions from database
      const response = await fetch("http://146.190.165.62:5001/api/completions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🎓 Fetching completion history from database:", result);
        setCompletionHistory(result.completions || []);
      } else {
        console.error("Failed to fetch completion history");
        setCompletionHistory([]);
      }
    } catch (error) {
      console.error("Error fetching completion history:", error);
      setCompletionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Download completion certificate as PDF
  const downloadCompletion = async () => {
    try {
      // Basic validation
      if (!completionData.candidateName) {
        setError("Please enter Candidate Name before downloading");
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

            <!-- Candidate Name -->
            <h2 style="
              font-size: 42px;
              color: #10b981;
              margin: 30px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            ">${completionData.candidateName}</h2>

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
      const fileName = `${completionData.candidateName.replace(
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
            "http://146.190.165.62:5001/api/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                candidateName: completionData.candidateName,
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

  // Handle offer letter date changes
  const handleOfferDateChange = (field, value) => {
    setOfferData((prev) => ({
      ...prev,
      [field]: formatDisplayDate(value),
      [`${field}Input`]: value,
    }));
  };

  // Handle save button click for offer letter
  const handleOfferSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "candidateName",
        "position",
        "joiningDate",
        "offerID",
        "issueDate",
      ];

      const missingFields = requiredFields.filter((field) => !offerData[field]);

      if (missingFields.length > 0) {
        throw new Error("Please fill all required fields");
      }

      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      console.log(
        "Token value:",
        token ? `${token.substring(0, 20)}...` : "No token"
      );

      if (!token) {
        throw new Error("Authentication required. Please login.");
      }

      console.log("Attempting to save offer with ID:", offerData.offerID);

      // Save to database via API
      const response = await fetch("http://146.190.165.62:5001/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateName: offerData.candidateName,
          position: offerData.position,
          joiningDate: offerData.joiningDate,
          offerID: offerData.offerID,
          issueDate: offerData.issueDate,
        }),
      });

      console.log("Offer save response status:", response.status);

      const result = await response.json();
      console.log("Offer save response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to save offer letter");
      }

      // Save to local storage for backward compatibility
      const timestamp = new Date().toISOString();
      const offerWithTimestamp = {
        ...offerData,
        createdAt: timestamp,
        _id: result.offer?._id || Date.now().toString(),
      };

      const existingOffers = JSON.parse(localStorage.getItem("offers") || "[]");

      localStorage.setItem(
        "offers",
        JSON.stringify([...existingOffers, offerWithTimestamp])
      );

      setIsSaved(true);
      
      // Refresh offer history if it's currently being shown
      if (showOfferHistory) {
        fetchOfferHistory();
      }
      
      setTimeout(() => {
        setOfferData(initialOfferData);
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // View Offer History - Database Based
  const fetchOfferHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found for fetching offer history");
        setOfferHistory([]);
        return;
      }

      // Fetch all offers from database
      const response = await fetch("http://146.190.165.62:5001/api/offers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("💼 Fetching offer history from database:", result);
        setOfferHistory(result.offers || []);
      } else {
        console.error("Failed to fetch offer history");
        setOfferHistory([]);
      }
    } catch (error) {
      console.error("Error fetching offer history:", error);
      setOfferHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Download offer letter as PDF
  const downloadOffer = async () => {
    try {
      // Basic validation
      if (!offerData.candidateName) {
        setError("Please enter Candidate Name before downloading");
        return;
      }

      if (!offerData.offerID) {
        setError("Please enter Offer ID before downloading");
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log("Starting offer letter generation...");

      // Create offer letter element in memory
      const offerHTML = `
        <div id="offer-for-download" style="
          width: 1200px;
          height: 1600px;
          background: white;
          padding: 60px;
          position: relative;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          border: 2px solid #e74c3c;
        ">
          <!-- Offer Letter Content -->
          <div style="height: 100%; padding: 40px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #e74c3c; padding-bottom: 20px;">
              <h1 style="
                font-size: 36px;
                color: #e74c3c;
                margin: 0 0 10px 0;
                font-weight: bold;
                letter-spacing: 2px;
              ">JOB OFFER LETTER</h1>
              <p style="
                font-size: 16px;
                color: #333;
                margin: 0;
                font-weight: 600;
              ">${offerData.companyName}</p>
            </div>

            <!-- Date and Offer ID -->
            <div style="margin-bottom: 30px; text-align: right;">
              <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Date:</strong> ${
                offerData.issueDate || new Date().toLocaleDateString()
              }</p>
              <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Offer ID:</strong> ${
                offerData.offerID
              }</p>
            </div>

            <!-- Candidate Info -->
            <div style="margin-bottom: 30px;">
              <p style="margin: 5px 0; color: #333; font-size: 16px; font-weight: 600;">Dear ${
                offerData.candidateName
              },</p>
            </div>

            <!-- Main Content -->
            <div style="line-height: 1.8; color: #333; font-size: 15px; text-align: justify;">
              <p style="margin-bottom: 20px;">
                We are pleased to extend this formal offer of employment for the position of <strong style="color: #e74c3c;">${
                  offerData.position
                }</strong> 
                in our <strong>${
                  offerData.department
                }</strong> department at <strong>${
        offerData.companyName
      }</strong>.
              </p>

              <p style="margin-bottom: 20px;">
                We believe that your skills, experience, and enthusiasm make you an excellent fit for our team, 
                and we are excited about the possibility of you joining our organization.
              </p>

              <!-- Terms and Conditions -->
              <div style="margin: 30px 0;">
                <h3 style="color: #e74c3c; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e74c3c; padding-bottom: 5px;">Terms and Conditions:</h3>
                
                <div style="margin-bottom: 15px;">
                  <strong>Position:</strong> ${offerData.position}<br>
                  <strong>Department:</strong> ${offerData.department}<br>
                  <strong>Employment Type:</strong> ${
                    offerData.employmentType
                  }<br>
                  <strong>Work Location:</strong> ${offerData.workLocation}
                </div>

                <div style="margin-bottom: 15px;">
                  <strong>Joining Date:</strong> ${offerData.joiningDate}<br>
                  <strong>Probation Period:</strong> ${
                    offerData.probationPeriod
                  }<br>
                  <strong>Salary:</strong> ${offerData.salary} per annum
                </div>

                <div style="margin-bottom: 15px;">
                  <strong>Reporting Location:</strong><br>
                  ${offerData.companyAddress}
                </div>
              </div>

              <p style="margin-bottom: 20px;">
                This offer is valid until <strong style="color: #e74c3c;">${
                  offerData.validUntil
                }</strong>. 
                Please confirm your acceptance by signing and returning this letter by the specified date.
              </p>

              <p style="margin-bottom: 30px;">
                We look forward to welcoming you to our team and are confident that you will make significant 
                contributions to our continued success.
              </p>
            </div>

            <!-- Footer Section -->
            <div style="margin-top: 50px;">
              <div style="display: flex; justify-content: space-between; align-items: end;">
                <!-- Left Side - HR Signature -->
                <div style="text-align: left; flex: 1;">
                  <div style="margin-bottom: 40px;">
                    <div style="border-bottom: 2px solid #333; width: 200px; margin-bottom: 10px; height: 30px;"></div>
                    <p style="margin: 5px 0; font-weight: bold; font-size: 14px; color: #333;">${
                      offerData.hrName || "Sarah Johnson"
                    }</p>
                    <p style="margin: 5px 0; font-size: 12px; color: #333;">${
                      offerData.hrTitle || "HR Manager"
                    }</p>
                    <p style="margin: 5px 0; font-size: 12px; color: #333;">${
                      offerData.companyName
                    }</p>
                  </div>
                </div>

                <!-- Right Side - Candidate Acceptance -->
                <div style="text-align: right; flex: 1;">
                  <p style="margin-bottom: 10px; font-weight: 600; color: #333;">Candidate Acceptance:</p>
                  <div style="border-bottom: 2px solid #333; width: 200px; margin: 0 0 10px auto; height: 30px;"></div>
                  <p style="margin: 5px 0; font-size: 12px; color: #333;">Signature</p>
                  <p style="margin: 5px 0; font-size: 12px; color: #333;">Date: _______________</p>
                </div>
              </div>
            </div>

            <!-- Company Stamp Area -->
            <div style="text-align: center; margin-top: 40px; padding: 20px; border: 2px dashed #e74c3c; border-radius: 10px;">
              <p style="margin: 0; color: #e74c3c; font-size: 12px; font-style: italic;">Company Seal/Stamp</p>
            </div>
          </div>
        </div>
      `;

      console.log("Creating temporary DOM element...");

      // Create temporary element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = offerHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "1200px";
      tempDiv.style.height = "1600px";
      document.body.appendChild(tempDiv);

      const offerElement = tempDiv.querySelector("#offer-for-download");

      if (!offerElement) {
        throw new Error("Could not create offer letter element");
      }

      console.log("Generating canvas from offer letter element...");

      // Generate offer letter image and PDF
      const canvas = await html2canvas(offerElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 1200,
        height: 1600,
        logging: true,
      });

      console.log("Canvas generated, creating PDF...");

      const imgData = canvas.toDataURL("image/png");

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = 10;
      const y = 10;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

      // Download PDF
      const fileName = `${offerData.candidateName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}-offer-${offerData.offerID.replace(/[^a-z0-9]/gi, "_")}.pdf`;

      console.log("Saving PDF as:", fileName);
      pdf.save(fileName);

      // Try to save to database (but don't fail if it doesn't work)
      try {
        const token = localStorage.getItem("token");
        console.log("Download - Token exists:", !!token);

        if (token) {
          console.log("Attempting to save offer to database...");
          const response = await fetch("http://146.190.165.62:5001/api/offers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              candidateName: offerData.candidateName,
              position: offerData.position,
              joiningDate: offerData.joiningDate,
              offerID: offerData.offerID,
              issueDate: offerData.issueDate || new Date().toLocaleDateString(),
            }),
          });

          console.log("Download save response status:", response.status);

          if (response.ok) {
            const result = await response.json();
            console.log("Offer letter saved to database successfully", result);
          } else {
            const result = await response.json();
            console.warn("Could not save offer to database:", result);
          }
        } else {
          console.warn("No token found for database save");
        }
      } catch (dbError) {
        console.warn(
          "Database save failed (continuing anyway):",
          dbError.message
        );
      }

      // Remove temporary element
      document.body.removeChild(tempDiv);

      console.log("Offer letter download completed successfully!");
    } catch (error) {
      console.error("Error generating offer letter:", error);
      setError(
        `Error generating offer letter: ${error.message}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="certificate-page">
      <div className="certificate-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${
              activeTab === "internship" ? "active" : ""
            }`}
            onClick={() => setActiveTab("internship")}
          >
            📋 Certificates
          </button>
          <button
            className={`tab-button ${
              activeTab === "completion" ? "active" : ""
            }`}
            onClick={() => setActiveTab("completion")}
          >
            🎓 Completion Letters
          </button>
          <button
            className={`tab-button ${activeTab === "offer" ? "active" : ""}`}
            onClick={() => setActiveTab("offer")}
          >
            💼 Offer Letters
          </button>
        </div>

        {/* Internship Certificate Form */}
        {activeTab === "internship" && (
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
                <label required>Candidate Name:</label>
                <input
                  type="text"
                  value={certificateData.candidateName}
                  onChange={(e) =>
                    setCertificateData({
                      ...certificateData,
                      candidateName: e.target.value,
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
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  required
                />
                {certificateData.startDate && (
                  <div className="date-display">
                    {certificateData.startDate}
                  </div>
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
                  onChange={(e) =>
                    handleDateChange("issueDate", e.target.value)
                  }
                  required
                />
                {certificateData.issueDate && (
                  <div className="date-display">
                    {certificateData.issueDate}
                  </div>
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
                onClick={handleCertificateHistoryToggle}
                className="history-button"
              >
                {showCertificateHistory ? "Hide History" : "View Certificate History"}
              </button>

              <button
                onClick={downloadCertificate}
                className="download-button"
                disabled={!certificateData.candidateName || !certificateData.certID}
              >
                Download Certificate
              </button>
            </div>

            {/* Certificate History Section */}
            {showCertificateHistory && (
              <div className="history-section">
                {historyLoading ? (
                  <div className="loading-message">Loading history...</div>
                ) : certificateHistory.length === 0 ? (
                  <div className="no-data-message">No certificates found in database.</div>
                ) : (
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Candidate Name</th>
                          <th>College Name</th>
                          <th>Internship Type</th>
                          <th>Certificate ID</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Issue Date</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificateHistory.map((cert, index) => (
                          <tr key={cert._id || index}>
                            <td>{cert.candidateName}</td>
                            <td>{cert.collegeName}</td>
                            <td>{cert.internshipType}</td>
                            <td>{cert.certID}</td>
                            <td>{cert.startDate || "N/A"}</td>
                            <td>{cert.endDate || "N/A"}</td>
                            <td>{cert.issueDate || "N/A"}</td>
                            <td>{cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completion Certificate Form */}
        {activeTab === "completion" && (
          <div className="admin-panel">
            <h3>Completion Letter Data Input</h3>

            {isSaved && (
              <div className="save-message">
                Completion certificate data saved successfully!
              </div>
            )}
            {error && <div className="error-message">{error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label required>Candidate Name:</label>
                <input
                  type="text"
                  value={completionData.candidateName}
                  onChange={(e) =>
                    setCompletionData({
                      ...completionData,
                      candidateName: e.target.value,
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
                  onChange={(e) =>
                    handleCompletionDateChange("startDate", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleCompletionDateChange("endDate", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleCompletionDateChange("issueDate", e.target.value)
                  }
                  required
                />
                {completionData.issueDate && (
                  <div className="date-display">{completionData.issueDate}</div>
                )}
              </div>
            </div>

            <div className="button-container">
              <button
                onClick={handleCompletionSave}
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Completion Data"}
              </button>

              <button
                onClick={handleCompletionHistoryToggle}
                className="history-button"
              >
                {showCompletionHistory ? "Hide History" : "View Completion History"}
              </button>

              <button
                onClick={downloadCompletion}
                className="download-button"
                disabled={!completionData.candidateName || !completionData.certID}
              >
                {isLoading ? "Generating..." : "Download Certificate"}
              </button>
            </div>

            {/* Completion History Section */}
            {showCompletionHistory && (
              <div className="history-section">
                <h4>Completion Certificate History</h4>
                {historyLoading ? (
                  <div className="loading-message">Loading history...</div>
                ) : completionHistory.length === 0 ? (
                  <div className="no-data-message">No completion certificates found in database.</div>
                ) : (
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Candidate Name</th>
                          <th>Course Type</th>
                          <th>Organization</th>
                          <th>Duration</th>
                          <th>Certificate ID</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Issue Date</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completionHistory.map((completion, index) => (
                          <tr key={completion._id || index}>
                            <td>{completion.candidateName}</td>
                            <td>{completion.courseType}</td>
                            <td>{completion.organizationName}</td>
                            <td>{completion.duration}</td>
                            <td>{completion.certID}</td>
                            <td>{completion.startDate || "N/A"}</td>
                            <td>{completion.endDate || "N/A"}</td>
                            <td>{completion.issueDate}</td>
                            <td>{completion.createdAt ? new Date(completion.createdAt).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Offer Letter Form */}
        {activeTab === "offer" && (
          <div className="admin-panel">
            <h3>Offer Letter Data Input</h3>

            {isSaved && (
              <div className="save-message">
                Offer letter data saved successfully!
              </div>
            )}
            {error && <div className="error-message">{error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label required>Candidate Name:</label>
                <input
                  type="text"
                  value={offerData.candidateName}
                  onChange={(e) =>
                    setOfferData({
                      ...offerData,
                      candidateName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label required>Position:</label>
                <select
                  value={offerData.position}
                  onChange={(e) =>
                    setOfferData({
                      ...offerData,
                      position: e.target.value,
                    })
                  }
                >
                  {[
                    "Software Developer",
                    "Frontend Developer",
                    "Backend Developer",
                    "Full Stack Developer",
                    "UI/UX Designer",
                    "Data Scientist",
                    "DevOps Engineer",
                    "QA Engineer",
                    "Project Manager",
                    "Business Analyst",
                    "Digital Marketing Executive",
                    "HR Executive",
                  ].map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label required>Joining Date:</label>
                <input
                  type="date"
                  value={offerData.joiningDateInput}
                  onChange={(e) =>
                    handleOfferDateChange("joiningDate", e.target.value)
                  }
                  required
                />
                {offerData.joiningDate && (
                  <div className="date-display">{offerData.joiningDate}</div>
                )}
              </div>

              <div className="form-group">
                <label required>Offer ID:</label>
                <input
                  type="text"
                  value={offerData.offerID}
                  onChange={(e) =>
                    setOfferData({
                      ...offerData,
                      offerID: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label required>Issue Date:</label>
                <input
                  type="date"
                  value={offerData.issueDateInput}
                  onChange={(e) =>
                    handleOfferDateChange("issueDate", e.target.value)
                  }
                  required
                />
                {offerData.issueDate && (
                  <div className="date-display">{offerData.issueDate}</div>
                )}
              </div>
            </div>

            <div className="button-container">
              <button
                onClick={handleOfferSave}
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Offer Data"}
              </button>

              <button
                onClick={handleOfferHistoryToggle}
                className="history-button"
              >
                {showOfferHistory ? "Hide History" : "View Offer History"}
              </button>

              <button
                onClick={downloadOffer}
                className="download-button"
                disabled={!offerData.candidateName || !offerData.offerID}
              >
                {isLoading ? "Generating..." : "Download Offer Letter"}
              </button>
            </div>

            {/* Offer History Section */}
            {showOfferHistory && (
              <div className="history-section">
                <h4>Offer Letter History</h4>
                {historyLoading ? (
                  <div className="loading-message">Loading history...</div>
                ) : offerHistory.length === 0 ? (
                  <div className="no-data-message">No offer letters found in database.</div>
                ) : (
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Candidate Name</th>
                          <th>Position</th>
                          <th>Joining Date</th>
                          <th>Offer ID</th>
                          <th>Issue Date</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offerHistory.map((offer, index) => (
                          <tr key={offer._id || index}>
                            <td>{offer.candidateName}</td>
                            <td>{offer.position}</td>
                            <td>{offer.joiningDate}</td>
                            <td>{offer.offerID}</td>
                            <td>{offer.issueDate}</td>
                            <td>{offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
