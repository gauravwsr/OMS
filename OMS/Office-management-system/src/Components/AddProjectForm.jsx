import React, { useState } from 'react';
import './AddProjectForm.css';

const AddProjectForm = ({ onClose }) => {
  const [date, setDate] = useState('1 Jan 2023');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([
    { id: 1, name: 'Nikhil Rawane', role: 'UI/UX Designer' },
    { id: 2, name: 'Vijay Pawar', role: 'Web Developer' },
    { id: 3, name: 'Vedant Ghode', role: 'Web Data Uploader' },
    { id: 4, name: 'Mayur Bagiche', role: 'Data Security' },
    { id: 5, name: 'Tanushree Mendhe', role: 'Tech Developer' },
    { id: 6, name: 'Purva Budhhe', role: 'Tech Developer' }
  ]);
  
  const closeModal = () => {
    if (onClose) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted');
  };
  
  const removeEmployee = (id) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== id));
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="add-project-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Projects</h2>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="date-wrapper">
            <div className="date-container">
              <label>Date : </label>
              <div className="date-input-wrapper">
                <input type="text" value={date} onChange={(e) => setDate(e.target.value)} />
                <span className="calendar-icon">📅</span>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>Project Title :</label>
            <input type="text" placeholder="Write Here . . . ." />
          </div>
          
          <div className="form-group">
            <label>Project Description :</label>
            <textarea placeholder="Write Here . . . ."></textarea>
          </div>
          
          <div className="date-row">
            <div className="date-field">
              <label>Start Date :</label>
              <div className="date-input-container">
                <input type="text" />
                <span className="calendar-icon">📅</span>
              </div>
            </div>
            
            <div className="date-field">
              <label>Due Date :</label>
              <div className="date-input-container">
                <input type="text" />
                <span className="calendar-icon">📅</span>
              </div>
            </div>
          </div>
          
          <div className="documentation-section">
            <h3>Documentation</h3>
            
            <div className="documents-row">
              <div className="document-item">
                <label>Product Brochure :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
              
              <div className="document-item">
                <label>PPT available :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
              
              <div className="document-item">
                <label>Covering Letter :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
            </div>
            
            <div className="documents-row">
              <div className="document-item">
                <label>Product Brochure :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
              
              <div className="document-item">
                <label>PPT available :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
              
              <div className="document-item">
                <label>Covering Letter :</label>
                <div className="file-upload-container">
                  <button type="button" className="choose-file-btn">Choose File</button>
                  <span className="no-file-text">No File Chosen</span>
                </div>
                <div className="file-info">Max File Size: 3 MB</div>
                <div className="file-types">Allowed File (.jpg, .jpeg, .png, .pdf)</div>
              </div>
            </div>
          </div>
          
          <div className="assign-employee-section">
      <label>Assign Employee :</label>
      <div className="select-dropdown" onClick={toggleDropdown}>
        <div className="select-field">
          <span>Select Employee...</span>
          <span className="dropdown-arrow">▼</span>
        </div>
      </div>
      
      <div className="employee-pills-container">
        {selectedEmployees.map(employee => (
          <div key={employee.id} className="employee-pill">
            <div className="employee-pill-info">
              <div className="employee-pill-name">{employee.name}</div>
              <div className="employee-pill-role">{employee.role}</div>
            </div>
            <button 
              type="button" 
              className="remove-pill-employee" 
              onClick={() => removeEmployee(employee.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
          
          <div className="form-actions">
            <button type="submit" className="add-button">ADD</button>
            <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm;