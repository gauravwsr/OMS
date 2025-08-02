import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Employee.css";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [formData, setFormData] = useState({
    candidateId: "",
    fullName: "",
    gender: "",
    birthDate: "",
    maritalStatus: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
    phoneNo: "",
    personalMail: "",
    officialEmail: "",
    emergencyNo: "",
    role: "",
    subRole: "",
    joiningDate: "",
    salary: "",
    company: "",
    qualification: "",
    otherQualification: "",
    aadharCard: "",
    panCard: "",
    bankName: "",
    branchName: "",
    accountNo: "",
    ifscCode: "",
    bankAccountName: "",
    photoUrl: "",
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/candidates/${id}`
      );
      if (response.data.success) {
        const employee = response.data.data;

        // Format dates for input fields
        const formattedData = {
          ...employee,
          birthDate: employee.birthDate
            ? new Date(employee.birthDate).toISOString().split("T")[0]
            : "",
          joiningDate: employee.joiningDate
            ? new Date(employee.joiningDate).toISOString().split("T")[0]
            : "",
        };
        setFormData(formattedData);

        // Check face registration status from face recognition server
        await checkFaceRegistrationStatus(employee.fullName);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      alert("Failed to fetch employee data");
    } finally {
      setLoading(false);
    }
  };

  const checkFaceRegistrationStatus = async (fullName) => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/registered-users"
      );
      if (response.data && response.data.registered_users) {
        const isRegistered = response.data.registered_users.some(
          (user) => user.name === fullName
        );
        setIsFaceRegistered(isRegistered);
        console.log(
          `Face registration status for ${fullName}: ${
            isRegistered ? "Registered" : "Not Registered"
          }`
        );
      } else {
        setIsFaceRegistered(false);
      }
    } catch (error) {
      console.error("Error checking face registration status:", error);
      // If face server is not available, check database fallback
      setIsFaceRegistered(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `http://localhost:5000/api/candidates/${id}`,
        formData
      );

      if (response.data.success) {
        alert("Employee updated successfully!");
        navigate("/database");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert(error.response?.data?.message || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/database");
  };

  // Face Registration Functions
  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Please allow camera access for face registration.");
    }
  };

  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImages((prev) => [...prev, imageDataUrl]);
    }
  };

  const handleFaceRegistration = async () => {
    if (capturedImages.length < 5) {
      alert("Please capture at least 5 images for better accuracy.");
      return;
    }
    setIsCapturing(true);
    stopVideoStream();

    try {
      // Register face with the face recognition server
      const response = await axios.post("http://localhost:5001/register_face", {
        name: formData.fullName,
        images: capturedImages,
      });
      console.log("Face registration response:", response.data);

      // Store face encodings in backend database
      if (formData.candidateId) {
        try {
          const faceEncodingsResponse = await axios.put(
            `http://localhost:5000/api/candidates/${formData.candidateId}/face-encodings`,
            {
              faceEncodings: capturedImages, // Store captured images as face data
              faceImagePaths: [`face_images/${formData.fullName}`], // Store image path
            }
          );
          console.log(
            "Face encodings stored in database:",
            faceEncodingsResponse.data
          );
        } catch (dbError) {
          console.error("Error storing face encodings in database:", dbError);
          // Continue with success message even if DB storage fails
        }
      }

      // Update face registration status after successful registration
      await checkFaceRegistrationStatus(formData.fullName);

      alert(
        `✅ Face registered successfully for ${formData.fullName}! ${response.data.message}`
      );
      setShowWebcamModal(false);
      setCapturedImages([]);
    } catch (error) {
      console.error("Error registering face:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to register face. Please ensure the face recognition server is running on port 5001.";
      alert(`❌ ${errorMessage}`);
      startVideoStream();
    } finally {
      setIsCapturing(false);
    }
  };

  const openFaceRegistration = () => {
    setCapturedImages([]);
    setShowWebcamModal(true);
    setTimeout(() => {
      startVideoStream();
    }, 100);
  };

  const closeFaceRegistration = () => {
    setShowWebcamModal(false);
    stopVideoStream();
    setCapturedImages([]);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="employee-form-container">
      <div className="employee-form-header">
        <h2>Edit Employee</h2>
        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            form="editEmployeeForm"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Employee"}
          </button>
        </div>
      </div>

      <form
        id="editEmployeeForm"
        onSubmit={handleSubmit}
        className="employee-form"
      >
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Employee ID *</label>
              <input
                type="text"
                name="candidateId"
                value={formData.candidateId}
                onChange={handleInputChange}
                required
                disabled
              />
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label>Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Marital Status</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Personal Email *</label>
              <input
                type="email"
                name="personalMail"
                value={formData.personalMail}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Official Email</label>
              <input
                type="email"
                name="officialEmail"
                value={formData.officialEmail}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Emergency Number</label>
              <input
                type="tel"
                name="emergencyNo"
                value={formData.emergencyNo}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="form-section">
          <h3>Professional Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employee Type *</label>
              <select
                name="subRole"
                value={formData.subRole}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Employee Type</option>
                <option value="HR Executive">HR Executive</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Developer">Developer</option>
                <option value="App Developer">App Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Digital Marketing">Digital Marketing</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Joining Date</label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Bank Information Section */}
        <div className="form-section">
          <h3>Bank Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Branch Name</label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="accountNo"
                value={formData.accountNo}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Aadhar Card</label>
              <input
                type="text"
                name="aadharCard"
                value={formData.aadharCard}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>PAN Card</label>
              <input
                type="text"
                name="panCard"
                value={formData.panCard}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Face Recognition Section */}
        <div className="form-section">
          <h3>Face Recognition</h3>
          <div className="face-registration-section">
            {isFaceRegistered ? (
              <div className="face-registered-status">
                <div className="success-message">
                  ✅ Face registration completed for this employee
                </div>
                <p>
                  Employee can now use face recognition for attendance marking.
                </p>
                <button
                  type="button"
                  className="re-register-btn"
                  onClick={openFaceRegistration}
                >
                  Re-register Face
                </button>
              </div>
            ) : (
              <div className="face-not-registered">
                <div className="warning-message">
                  ⚠️ Face registration pending for this employee
                </div>
                <p>
                  Face registration is required for attendance system. Click
                  below to register face for attendance marking.
                </p>
                <button
                  type="button"
                  className="register-face-btn"
                  onClick={openFaceRegistration}
                >
                  📷 Register Face for Attendance
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Face Registration Modal */}
      {showWebcamModal && (
        <div className="webcam-modal">
          <div className="webcam-modal-content">
            <div className="webcam-header">
              <h3>Face Registration for {formData.fullName}</h3>
              <button
                className="close-webcam-btn"
                onClick={closeFaceRegistration}
              >
                ×
              </button>
            </div>

            <div className="webcam-content">
              <div className="webcam-section">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="webcam-video"
                />

                <div className="webcam-controls">
                  <p>
                    Captured Images: <strong>{capturedImages.length}</strong>{" "}
                    (Minimum 5 required)
                  </p>

                  <div className="captured-images">
                    {capturedImages.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`capture ${index}`}
                        className="captured-thumbnail"
                      />
                    ))}
                  </div>

                  <div className="webcam-buttons">
                    <button
                      type="button"
                      className="capture-btn"
                      onClick={handleCapture}
                      disabled={isCapturing || capturedImages.length >= 20}
                    >
                      📷 Capture Image
                    </button>

                    <button
                      type="button"
                      className="register-btn"
                      onClick={handleFaceRegistration}
                      disabled={isCapturing || capturedImages.length < 5}
                    >
                      {isCapturing ? "Registering..." : "Register Face"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEmployee;
