# Team Lead Project Assignment Guide

## Overview

यह guide Team Leads के लिए है जो अपने team members को projects assign करना चाहते हैं। जब Team Lead किसी employee को project assign करता है, तो वह employee अपने dashboard में उस project की complete details देख सकता है।

## How Project Assignment Works

### 1. Direct Project Assignment

Team Lead किसी employee को directly project assign कर सकता है:

**Steps:**

1. Team Lead Dashboard में जाएं
2. किसी project card पर **User icon** (👤) button click करें
3. **"Assign Employees to Project"** modal open होगा
4. Available employees की list दिखेगी
5. Employees को select करें जिन्हें project assign करना है
6. **"Assign Employees"** button click करें

**Result:**

- Selected employees उस project को अपने Employee Dashboard में देख सकेंगे
- उन्हें project की complete details मिलेंगी:
  - Project description और requirements
  - Technologies used
  - Timeline और milestones
  - Budget information
  - Client contact details
  - Team information

### 2. Task Assignment (Indirect Project Access)

जब Team Lead किसी employee को task assign करता है, तो automatically उस employee को उस project की access मिल जाती है:

**Steps:**

1. Team Lead Dashboard में project details open करें
2. **"Create New Task"** button click करें
3. Task details fill करें
4. **"Assign To"** section में employees select करें
5. Task create करें

**Result:**

- Task assigned employees को automatically project access मिल जाती है
- वे अपने Employee Dashboard में project देख सकते हैं
- उन्हें अपने assigned tasks भी दिखते हैं

## Employee Dashboard Features

जब employees को project assign होता है, तो उन्हें निम्नलिखित features मिलते हैं:

### Project Cards

- **Basic Information**: Project ID, Status, Priority
- **Timeline**: Start date, due date, progress
- **Client Details**: Client name और contact information
- **Team Information**: Team lead और team members
- **Technologies**: Project में use होने वाली technologies
- **Budget**: Project budget और expenses
- **Progress Bar**: Visual project completion status

### Project Details Modal

Click करने पर comprehensive project details:

- **Project Overview**: Complete description और requirements
- **Timeline Management**: All important dates और milestones
- **Team Collaboration**: Team member information
- **Task Management**: Assigned tasks का kanban board
- **Progress Tracking**: Task-wise progress updates

### Task Management

- **View Tasks**: अपने assigned tasks देख सकते हैं
- **Update Status**: Task status change कर सकते हैं (Pending → In Progress → Completed)
- **Task Points**: Individual task points को complete mark कर सकते हैं
- **Progress Updates**: Real-time progress tracking

## Important Notes

### Permissions

- **Team Leads**: Projects assign कर सकते हैं, tasks create कर सकते हैं
- **Employees**: Projects view कर सकते हैं, tasks update कर सकते हैं (create नहीं)

### Automatic Updates

- जब Team Lead employee को project assign करता है, तो employee का dashboard automatically update हो जाता है
- जब Team Lead task assign करता है, तो employee को project access automatically मिल जाती है
- Task progress updates real-time में reflect होते हैं

### Project Visibility

Employee को project access मिलती है अगर:

1. उसे directly project assign किया गया है, या
2. उसे कोई task assign किया गया है उस project में

## API Endpoints Used

### For Team Leads:

- `GET /api/client-projects/employees/Employee` - Available employees list
- `PUT /api/client-projects/:id/assign-employees` - Assign employees to project
- `POST /api/team-lead/projects/:projectId/tasks` - Create new task

### For Employees:

- `GET /api/client-projects/employee/:identifier` - Get assigned projects
- `GET /api/employee/projects/:projectId/tasks` - Get project tasks
- `PUT /api/employee/tasks/:taskId/status` - Update task status
- `PUT /api/employee/tasks/:taskId/points/:pointId` - Update task points

## Best Practices

1. **Clear Assignment**: हमेशा relevant employees को projects assign करें
2. **Task Distribution**: Tasks को properly distribute करें team members में
3. **Regular Updates**: Task progress को regularly check करें
4. **Communication**: Project details को clear रखें employees के लिए
5. **Progress Tracking**: Regular basis पर project progress monitor करें

## Troubleshooting

### Employee को project नहीं दिख रहा?

- Check करें कि employee properly assigned है
- Ensure करें कि employee का identifier correct है
- Browser refresh करें

### Task assign नहीं हो रहा?

- Check करें कि proper employees selected हैं
- Ensure करें कि task details complete हैं
- Verify करें कि server running है

### Permission issues?

- Confirm करें कि user properly logged in है
- Check करें कि correct role assigned है
- Verify JWT token validity

यह system ensure करता है कि team collaboration smooth हो और employees को proper project visibility मिले।
