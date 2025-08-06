# Charge Handover - Candidate Schema Integration

## Changes Made

### Problem Addressed

The user requested that the "from employee" and "to employee" lists in the Charge Handover feature should fetch faculty/employees from the **Candidate schema** instead of the User schema.

### Files Modified

#### Backend Changes:

1. **`server-OMS/routes/userRoutes.js`**

   - Added import for `Candidate` model
   - Modified `/employees` endpoint to fetch from `Candidate` collection instead of `User`
   - Updated field mapping: `candidateId`, `fullName`, `email`, `role`, `subRole`, etc.

2. **`server-OMS/controllers/chargeHandoverController.js`**

   - Added import for `Candidate` model
   - Updated employee validation to check `Candidate.findOne({ candidateId: ... })`
   - Changed error messages to reference "candidate" instead of "employee"

3. **`server-OMS/models/chargeHandoverModel.js`**
   - Added comments to clarify that `fromEmployeeId` and `toEmployeeId` store Candidate IDs
   - Updated schema documentation

#### Frontend Changes:

4. **`src/Components/ChargeHandover/ChargeHandover.js`**
   - Updated `getEmployeeName()` function to use `candidateId` and `fullName`
   - Modified dropdown option mappings to use:
     - `key={employee._id || employee.candidateId}`
     - `value={employee._id || employee.candidateId}`
     - `{employee.fullName} - {employee.role}`
   - Updated filter logic for "To Employee" dropdown

#### Documentation:

5. **`CHARGE_HANDOVER_IMPLEMENTATION.md`**
   - Updated API endpoint descriptions
   - Added data source section explaining candidate schema integration
   - Updated database schema comments

### Technical Details

**Before:**

- Fetched employees from `User` collection
- Used `userId`, `name` fields
- Limited to system users only

**After:**

- Fetches employees from `Candidate` collection
- Uses `candidateId`, `fullName` fields
- Includes all candidates in the system (broader faculty pool)

### Benefits

1. **Better Data Integration**: Now uses the same candidate pool as other HR functions
2. **Comprehensive Faculty List**: Includes all candidates, not just system users
3. **Consistent Data Model**: Aligns with existing candidate management workflows
4. **More Accurate**: Faculty/employee data is typically more complete in candidate records

### API Response Format

```json
{
  "candidateId": "CAND001",
  "fullName": "John Doe",
  "email": "john.doe@company.com",
  "role": "Faculty",
  "subRole": "Senior Developer",
  "joiningDate": "2024-01-15",
  "salary": 75000,
  "company": "Demo Company"
}
```

The charge handover feature now properly integrates with the candidate management system and provides a more comprehensive view of available faculty members for handover assignments.
