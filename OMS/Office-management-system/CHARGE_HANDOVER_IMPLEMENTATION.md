# Charge Handover Feature Implementation

## Overview

A new "Charge Handover" feature has been added to the OMS (Office Management System) specifically for users with role=Admin and subRole="HR Manager". This feature allows HR Managers to manage employee charge handovers and transfers.

## Frontend Implementation

### Files Created/Modified

**New Components:**

- `src/Components/ChargeHandover/ChargeHandover.js` - Main charge handover component
- `src/Components/ChargeHandover/ChargeHandover.css` - Styling for the component

**Modified Files:**

- `src/MainContent.js` - Added menu item and route for Admin HR Manager users
  - Added `Admin_HR_Manager` role-specific menu with "Charge Handover" option
  - Added route: `/charge-handover`
  - Imported ChargeHandover component

### Menu Configuration

The sidebar menu now includes a "Charge Handover" option that appears only for users with:

- Role: `Admin`
- Sub Role: `HR Manager`

The menu item uses the FileText icon and navigates to `/charge-handover`.

### Features Included

1. **Access Control**: Only HR Managers can access the page
2. **Create Handovers**: Form to create new charge handovers with:

   - From Employee selection
   - To Employee selection
   - Handover Date
   - Department
   - Responsibilities
   - Assets
   - Documents
   - Additional Notes

3. **View Handovers**: Grid display of all charge handovers with status badges
4. **Responsive Design**: Mobile-friendly interface

## Backend Implementation

### Files Created

- `server-OMS/models/chargeHandoverModel.js` - MongoDB schema for charge handovers
- `server-OMS/controllers/chargeHandoverController.js` - Controller with business logic
- `server-OMS/routes/chargeHandoverRoutes.js` - API routes

### Modified Files

- `server-OMS/server.js` - Added charge handover routes
- `server-OMS/routes/userRoutes.js` - Added employees endpoint for HR Manager

### API Endpoints

- `POST /api/charge-handovers` - Create new handover
- `GET /api/charge-handovers` - Get all handovers (HR Manager only)
- `GET /api/charge-handovers/:id` - Get specific handover
- `PUT /api/charge-handovers/:id/status` - Update handover status
- `DELETE /api/charge-handovers/:id` - Delete handover
- `GET /api/charge-handovers/employee/:employeeId` - Get handovers for specific candidate
- `GET /api/employees` - Get all candidates (HR Manager only)

### Database Schema

```javascript
{
  fromEmployeeId: String (required), // Candidate ID from Candidate schema
  toEmployeeId: String (required),   // Candidate ID from Candidate schema
  handoverDate: Date (required),
  department: String (required),
  responsibilities: String,
  assets: String,
  documents: String,
  notes: String,
  status: Enum ['Pending', 'In Progress', 'Completed', 'Cancelled'],
  createdBy: String (required),
  approvedBy: String,
  approvedAt: Date,
  completedAt: Date,
  comments: Array of comment objects,
  timestamps: true
}
```

### Data Source

The employee/faculty lists are now fetched from the **Candidate schema** instead of the User schema:

- **From Employee** and **To Employee** dropdowns populate from `Candidate` collection
- Uses `candidateId`, `fullName`, and `role` fields from candidates
- Provides better integration with the existing candidate management system

### Security Features

- JWT authentication required for all endpoints
- Role-based access control (HR Manager only)
- Input validation and sanitization
- Employee existence verification

## How to Access

1. **Login as HR Manager**: User must have role="Admin" and subRole="HR Manager"
2. **Navigate to Sidebar**: Look for "Charge Handover" option in the sidebar menu
3. **Create Handover**: Click "Create New Handover" button to open the form
4. **Manage Handovers**: View, update status, and manage existing handovers

## Technology Stack

- **Frontend**: React.js with custom CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Icons**: React Feather Icons

## Future Enhancements

- Email notifications for handover assignments
- File attachment support
- Advanced status tracking with timeline
- Bulk handover operations
- Reports and analytics

## Testing

The implementation includes proper error handling, loading states, and user feedback mechanisms. All components are responsive and follow the existing design patterns of the OMS application.
