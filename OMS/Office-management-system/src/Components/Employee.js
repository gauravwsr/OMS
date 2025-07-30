import { useState, useRef, useCallback } from "react";
import { X, Upload, Camera } from "lucide-react";
import { useAuth } from "../Components/AuthProvider/AuthContext";
import axios from "axios";
import "./Employee.css";

const Employee = () => {
  // State variables
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [cv, setCv] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState("");
  const [subRole, setSubRole] = useState("");
  const { signup, user } = useAuth();
  const [credentials, setCredentials] = useState({
    candidateId: "",
    email: "",
    password: "",
    name: "",
  });
  const [showWebcamModal, setShowWebcamModal] = useState(false);
const [capturedImages, setCapturedImages] = useState([]);
const [isCapturing, setIsCapturing] = useState(false);

const videoRef = useRef(null);
const canvasRef = useRef(null);

const handleOpenWebcam = () => {
  if (!formData.fullName) {
    alert("Please enter the employee's Full Name before registering a face.");
    return;
  }
  setShowWebcamModal(true);
  setCapturedImages([]);
  startVideoStream();
};

const startVideoStream = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  } catch (err) {
    console.error("Error accessing webcam:", err);
    alert("Could not access the webcam. Please ensure you have given permission.");
    setShowWebcamModal(false);
  }
}, []);

const stopVideoStream = () => {
  if (videoRef.current && videoRef.current.srcObject) {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    videoRef.current.srcObject = null;
  }
};

const handleCapture = () => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImages(prev => [...prev, imageDataUrl]);
  }
};

const handleFinishFaceRegistration = async () => {
  if (capturedImages.length < 5) {
    alert("Please capture at least 5 images for better accuracy.");
    return;
  }
  setIsCapturing(true);
  stopVideoStream();

  try {
    const response = await axios.post('http://localhost:5001/register_face', {
      name: formData.fullName,
      images: capturedImages
    });
    alert(response.data.message);
    setShowWebcamModal(false);

  } catch (error) {
    console.error("Error registering face:", error);
    const errorMessage = error.response?.data?.error || "Failed to register face. See console for details.";
    alert(errorMessage);
    startVideoStream();
  } finally {
    setIsCapturing(false);
  }
};

  // Define roles based on user's role - Super Admin can only register HR Managers
  const getRolesForUser = () => {
    if (user?.role === "Super_Admin") {
      return {
        Admin: ["HR Manager"],
      };
    }
    // Admin with HR subrole can only create Employee and Intern accounts
    if (user?.role === "Admin" && user?.subRole === "HR") {
      return {
        Employee: [
          "Team Leader",
          "Manager",
          "Developer",
          "App Developer",
          "UI/UX Designer",
        ],
        Intern: ["Developer", "App Developer", "UI/UX Designer"],
      };
    }
    // Default roles for other users
    return {
      Admin: ["HR Executive"],
      Employee: [
        "Team Leader",
        "Manager",
        "Developer",
        "App Developer",
        "UI/UX Designer",
      ],
      Intern: ["Developer", "App Developer", "UI/UX Designer"],
    };
  };

  const roles = getRolesForUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidateId: "",
    fullName: "",
    gender: "", // Added gender field
    role: "",
    subRole: "",
    qualification: "",
    otherQualification: "",
    birthDate: "",
    address: "",
    maritalStatus: "",
    country: "",
    state: "",
    city: "",
    phoneNo: "",
    zipCode: "",
    emergencyNo: "",
    officialEmail: "",
    personalMail: "",
    aadharCard: "",
    joiningDate: "",
    panCard: "",
    branchName: "",
    bankName: "",
    ifscCode: "",
    accountNo: "",
    password: "",
    confirmPassword: "",
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time password validation
    if (name === "password" || name === "confirmPassword") {
      const currentPassword = name === "password" ? value : formData.password;
      const currentConfirmPassword =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (currentPassword && currentPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
      } else if (
        currentPassword &&
        currentConfirmPassword &&
        currentPassword !== currentConfirmPassword
      ) {
        setPasswordError("Passwords do not match");
      } else {
        setPasswordError("");
      }
    }
  };

  const MAX_SIZE_KB = 250;

  const handlePhotoUpload = (e) => {
    setError(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSizeKB = file.size / 1024;

      if (fileSizeKB > MAX_SIZE_KB) {
        setError(
          `File size (${fileSizeKB.toFixed(
            2
          )} KB) exceeds the maximum limit of ${MAX_SIZE_KB} KB`
        );
        return;
      }

      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoFile(null);
    setError(null);
  };

  // Handle CV Upload
  const handleCvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCv(file);
    }
  };

  // Function to upload image to Cloudinary
  const uploadImageToCloudinary = async (imageFile) => {
    try {
      const cloudinaryUploadPreset = "OMS_Employee"; // Replace with your Cloudinary upload preset
      const cloudinaryCloudName = "dhurwdiak"; // Replace with your Cloudinary cloud name

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", cloudinaryUploadPreset);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  };

  // Handle Save Button Click
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = [
        "candidateId",
        "fullName",
        "phoneNo",
        "personalMail",
        "role",
        "subRole",
        "gender",
        "password",
        "confirmPassword",
      ]; // Added gender and password fields to required fields
      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        alert(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        setLoading(false);
        return;
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match. Please try again.");
        setLoading(false);
        return;
      }

      // Validate password strength
      if (formData.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }

      // Create FormData object
      const data = new FormData();

      // Upload image to Cloudinary if exists
      let imageUrl = null;
      if (photoFile) {
        imageUrl = await uploadImageToCloudinary(photoFile);
        data.append("photoUrl", imageUrl); // Add the Cloudinary URL to form data
      }

      // Add all other form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      // If you still need to send the file for some other purpose
      if (cv) data.append("cv", cv);

      const response = await axios.post(
        "http://localhost:5000/api/candidates",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 5000,
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setCredentials({
          candidateId: response.data.credentials.candidateId,
          name: formData.fullName,
          email: formData.officialEmail,
          password: formData.password, // Use user-provided password
          role: formData.role,
          subRole: formData.subRole,
        });

        const userData = {
          name: formData.fullName,
          email: formData.officialEmail,
          password: formData.password, // Use user-provided password
          role: formData.role,
          subRole: formData.subRole,
        };

        // Call signup function with role and subRole
        await signup(
          userData.name,
          userData.email,
          userData.password,
          userData.role,
          userData.subRole
        );

        setShowModal(true);
        resetForm();
      }
    } catch (error) {
      let errorMessage = "Error saving candidate";

      if (error.code === "ERR_NETWORK") {
        errorMessage =
          "Unable to connect to server. Please check if the server is running.";
      } else if (error.response) {
        errorMessage = error.response.data.message || "Server error occurred";
      }

      console.error("Error details:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add a reset form function
  const resetForm = () => {
    setFormData({
      candidateId: "",
      fullName: "",
      gender: "",
      role: "",
      subRole: "",
      qualification: "",
      otherQualification: "",
      birthDate: "",
      address: "",
      maritalStatus: "",
      country: "",
      state: "",
      city: "",
      phoneNo: "",
      zipCode: "",
      emergencyNo: "",
      officialEmail: "",
      personalMail: "",
      aadharCard: "",
      joiningDate: "",
      panCard: "",
      branchName: "",
      bankName: "",
      ifscCode: "",
      accountNo: "",
      password: "",
      confirmPassword: "",
    });
    setPhoto(null);
    setPhotoFile(null);
    setCv(null);
    setPasswordError("");
  };

  const handleRegister = async () => {
    try {
      setShowModal(false);
      resetForm();
      alert("Candidate registered successfully!");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="main-cont">
      <div className="candidate-form-container">
        <div className="breadcrumb-container">
          <nav className="breadcrumb">
            <span>Employee</span>
            <span> &gt; </span>
            <span className="newcss">Add New Employee</span>
          </nav>
        </div>

        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Add New Candidate</h2>
            <button className="close-button">
              <X size={20} />
            </button>
          </div>

          <div className="form-content">
            <p className="description">
              Please fill out the following details to add a new Candidate to
              the system.
            </p>
            {user?.role === "Super_Admin" && (
              <div
                style={{
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #2196f3",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "20px",
                  color: "#1976d2",
                }}
              >
                <strong>Note:</strong> As a Super Admin, you can only register
                HR Managers through this form.
              </div>
            )}
            {user?.role === "Admin" && user?.subRole === "HR" && (
              <div
                style={{
                  backgroundColor: "#fff3e0",
                  border: "1px solid #ff9800",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "20px",
                  color: "#f57c00",
                }}
              >
                <strong>Note:</strong> As an Admin HR, you can only register
                Employees and Interns through this form.
              </div>
            )}
            <form onSubmit={handleSave}>
              {/* Upload Photo Section */}
              <div className="upload-container">
                <div className="upload-title">Profile Photo Upload</div>

                <div className="preview-container">
                  {photo ? (
                    <div className="photo-preview">
                      <div className="photo-wrapper">
                        <img
                          src={photo}
                          alt="Profile preview"
                          className="profile-photo"
                        />
                        <button
                          onClick={handleRemovePhoto}
                          className="remove-button"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                      <div className="file-info">
                        {photoFile && (
                          <span>
                            File size: {(photoFile.size / 1024).toFixed(2)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-photo">
                      <span>No image</span>
                    </div>
                  )}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="upload-controls">
                  <div className="warning-text">
                    Please upload a photo under 250KB
                  </div>

                  <label className="upload-button">
                    Upload Photo
                    <input
                      type="file"
                      className="hidden-input"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                <div className="upload-controls" style={{ marginTop: '10px' }}>
  <div className="warning-text">
    Or register face using the webcam for attendance system.
  </div>
  <button
    type="button"
    className="upload-button"
    onClick={handleOpenWebcam}
  >
    <Camera size={16} style={{ marginRight: '8px' }}/>
    Register Face via Webcam
  </button>
</div>
              </div>
              {/* Personal Information Section */}
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="candidateId">Candidate Id *</label>
                    <input
                      type="number"
                      id="candidateId"
                      name="candidateId"
                      value={formData.candidateId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="birthDate">Date of Birth *</label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  {/* Added Gender Field */}
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="maritalStatus">Marital Status</label>
                    <select
                      id="maritalStatus"
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address">Address *</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="form-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phoneNo">Phone Number *</label>
                    <input
                      type="tel"
                      id="phoneNo"
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="personalMail">Personal Email *</label>
                    <input
                      type="email"
                      id="personalMail"
                      name="personalMail"
                      value={formData.personalMail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="officialEmail">Official Email</label>
                    <input
                      type="email"
                      id="officialEmail"
                      name="officialEmail"
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="emergencyNo">
                      Emergency Contact Number *
                    </label>
                    <input
                      type="tel"
                      id="emergencyNo"
                      name="emergencyNo"
                      value={formData.emergencyNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details Section */}
              <div className="form-section">
                <h3 className="section-title">Employment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role *</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          role: e.target.value,
                          subRole: "",
                        });
                      }}
                      required
                    >
                      <option value="">Select Role</option>
                      {Object.keys(roles).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subRole">Sub-Role *</label>
                    <select
                      id="subRole"
                      name="subRole"
                      value={formData.subRole}
                      onChange={(e) =>
                        setFormData({ ...formData, subRole: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Sub-Role</option>
                      {formData.role &&
                        roles[formData.role].map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="joiningDate">Joining Date *</label>
                    <input
                      type="date"
                      id="joiningDate"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="salary">Salary (₹) *</label>
                    <input
                      type="number"
                      id="salary"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company *</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="form-section">
                <h3 className="section-title">Education Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="qualification">
                      Highest Qualification *
                    </label>
                    <select
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Master's">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="otherQualification">
                      Other Qualifications
                    </label>
                    <input
                      type="text"
                      id="otherQualification"
                      name="otherQualification"
                      value={formData.otherQualification}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* CV Upload */}
                <div className="form-row">
                  <div className="form-group">
                    <label
                      htmlFor="cv-upload"
                      className="upload-button secondary-upload"
                    >
                      <Upload size={16} /> Upload CV
                    </label>
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      style={{ display: "none" }}
                    />
                    {cv && (
                      <div className="file-info">
                        <span>{cv.name}</span>
                        <button
                          type="button"
                          className="remove-file"
                          onClick={() => setCv(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="form-section">
                <h3 className="section-title">Document Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadharCard">Aadhar Card Number *</label>
                    <input
                      type="text"
                      id="aadharCard"
                      name="aadharCard"
                      value={formData.aadharCard}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="panCard">PAN Card Number *</label>
                    <input
                      type="text"
                      id="panCard"
                      name="panCard"
                      value={formData.panCard}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="form-section">
                <h3 className="section-title">Bank Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName">Bank Name *</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="branchName">Branch Name *</label>
                    <input
                      type="text"
                      id="branchName"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountNo">Account Number *</label>
                    <input
                      type="text"
                      id="accountNo"
                      name="accountNo"
                      value={formData.accountNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ifscCode">IFSC Code *</label>
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankAccountName">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      id="bankAccountName"
                      name="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="form-section">
                <h3 className="section-title">Login Credentials</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      required
                      minLength="6"
                    />
                  </div>
                </div>
                {passwordError && (
                  <div
                    style={{
                      color: "#d32f2f",
                      fontSize: "14px",
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: "#ffebee",
                      border: "1px solid #ffcdd2",
                      borderRadius: "4px",
                    }}
                  >
                    {passwordError}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save & Register"}
                </button>
                <button type="button" className="cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showWebcamModal && (
  <div className="modal-overlay">
    <div className="modal-content" style={{maxWidth: '700px'}}>
      <div className="modal-header">
        <h3>Register Face for: {formData.fullName}</h3>
        <button
          onClick={() => {
            stopVideoStream();
            setShowWebcamModal(false);
          }}
          className="close-modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        {isCapturing ? (
           <div style={{textAlign: 'center', padding: '50px'}}>Processing... Please wait.</div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px', backgroundColor: '#000' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{marginTop: '15px', textAlign: 'center'}}>
                <p>Captured Images: <strong>{capturedImages.length}</strong> / 20</p>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginTop: '10px', maxHeight: '100px', overflowY: 'auto'}}>
                  {capturedImages.map((src, index) => (
                    <img key={index} src={src} alt={`capture ${index}`} style={{width: '50px', height: '50px', objectFit: 'cover', border: '1px solid #ccc'}} />
                  ))}
                </div>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer" style={{justifyContent: 'center', gap: '20px'}}>
         <button onClick={handleCapture} className="submit-button" disabled={isCapturing || capturedImages.length >= 20}>
            Capture Image
        </button>
        <button onClick={handleFinishFaceRegistration} className="confirm-button" disabled={isCapturing || capturedImages.length < 5}>
            Finish & Register
        </button>
      </div>
    </div>
  </div>
)}

      {/* Credentials Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registration Successful</h3>
              <button
                onClick={() => setShowModal(false)}
                className="close-modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Candidate has been registered successfully. Here are the login
                credentials:
              </p>
              <div className="credentials-info">
                <p>
                  <strong>Candidate ID:</strong> {credentials.candidateId}
                </p>
                <p>
                  <strong>Name:</strong> {credentials.name}
                </p>
                <p>
                  <strong>Email:</strong> {credentials.email}
                </p>
                <p>
                  <strong>Password:</strong> {credentials.password}
                </p>
              </div>
              <p className="important-note">
                Please save these credentials or share them with the candidate.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={handleRegister} className="confirm-button">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;
