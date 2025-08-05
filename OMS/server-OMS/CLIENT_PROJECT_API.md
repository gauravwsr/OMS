# Client Project Management API Documentation

## Overview
This API provides comprehensive client project management with team lead assignment functionality for the Office Management System (OMS).

## Base URL
```
http://localhost:5001/api
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Client Projects
```http
GET /client-projects
```
**Description:** Retrieves all client projects with populated team lead information.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "project_id",
      "projectId": "TT-1234567890",
      "clientName": "ABC Corp",
      "projectName": "Website Development",
      "projectType": "Development",
      "status": "In Progress",
      "teamLeadId": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "subRole": "Team Lead"
      },
      "assignedTeamLead": "John Doe",
      "leadName": "John Doe",
      "priority": "High",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-03-15T00:00:00.000Z",
      "budget": 50000,
      "description": "Complete website development project",
      "assignmentDate": "2024-01-10T00:00:00.000Z",
      "assignedBy": {
        "_id": "manager_id",
        "name": "Manager Name",
        "email": "manager@example.com"
      },
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Team Leads
```http
GET /client-projects/team-leads
```
**Description:** Retrieves all users with Team Lead role for assignment dropdown.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "subRole": "Team Lead",
      "specialization": "Frontend Development",
      "phoneNumber": "+1234567890",
      "department": "Development"
    }
  ]
}
```

### 3. Get Projects for Team Lead
```http
GET /client-projects/team-lead/:identifier
```
**Description:** Retrieves projects assigned to a specific team lead.

**Parameters:**
- `identifier` (string): Can be user ID, name, or email

**Response:**
```json
{
  "success": true,
  "count": 3,
  "teamLead": "identifier_value",
  "data": [
    {
      // Project objects with populated team lead info
    }
  ]
}
```

### 4. Get Single Project
```http
GET /client-projects/:id
```
**Description:** Retrieves detailed information about a specific project.

**Response:**
```json
{
  "success": true,
  "data": {
    // Complete project object with all populated fields
    "notes": [
      {
        "content": "Project update note",
        "addedBy": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "addedAt": "2024-01-15T00:00:00.000Z"
      }
    ]
  }
}
```

### 5. Create New Project
```http
POST /client-projects
```
**Access:** Project Manager only

**Request Body:**
```json
{
  "clientName": "ABC Corp",
  "projectName": "Website Development",
  "projectType": "Development",
  "status": "Planning",
  "priority": "High",
  "startDate": "2024-01-15",
  "endDate": "2024-03-15",
  "budget": 50000,
  "description": "Complete website development project",
  "requirements": ["Responsive design", "SEO optimization"],
  "projectId": "TT-1234567890", // Optional, auto-generated if not provided
  "projectPassword": "abc123" // Optional, auto-generated if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    // Complete created project object
  }
}
```

### 6. Assign Team Lead to Project
```http
PUT /client-projects/:id/assign-team-lead
```
**Access:** Project Manager only

**Request Body:**
```json
{
  "teamLeadId": "user_object_id",
  "teamLeadName": "John Doe" // Optional, will use user's name if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team lead John Doe assigned successfully",
  "data": {
    // Updated project object with assigned team lead
  }
}
```

### 7. Update Project
```http
PUT /client-projects/:id
```
**Description:** Updates project information.

**Request Body:**
```json
{
  "status": "In Progress",
  "priority": "Medium",
  // Any other fields to update
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    // Updated project object
  }
}
```

### 8. Delete Project
```http
DELETE /client-projects/:id
```
**Access:** Project Manager only

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### 9. Add Project Note
```http
POST /client-projects/:id/notes
```
**Description:** Adds a note to a project.

**Request Body:**
```json
{
  "content": "This is a project update note"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    // Updated project object with new note
  }
}
```

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Frontend Integration Notes

### For Project Manager Dashboard:
1. Use `GET /client-projects/team-leads` to populate team lead dropdown
2. Use `PUT /client-projects/:id/assign-team-lead` to assign team leads
3. Use `GET /client-projects` to fetch all projects for display

### For Team Lead Dashboard:
1. Use `GET /client-projects/team-lead/:identifier` where identifier is the logged-in user's ID, name, or email
2. Projects will be filtered to show only those assigned to the current team lead

### Authentication Context:
Make sure to include the JWT token in all API requests and handle authentication errors appropriately.

## Database Schema
The client project model includes:
- Automatic project ID generation
- Team lead assignment tracking
- Assignment history
- Project notes system
- Proper indexing for performance
- Validation and required fields
