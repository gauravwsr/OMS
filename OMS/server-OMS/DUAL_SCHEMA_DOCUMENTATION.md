# Dual-Schema Project Management System

## Overview

This system implements a dual-schema approach to solve the problem where project edits were being lost during CRM data refresh. The system now maintains two separate collections:

1. **CrmProject** - Stores original data from external CRM (read-only)
2. **WorkingProject** - Stores editable copies for day-to-day operations

## Schema Architecture

### CrmProject Model (`crmProjectModel.js`)

- **Purpose**: Store original data from external CRM API
- **Characteristics**: Read-only, updated only during CRM sync
- **Key Fields**:
  - `externalId`: Unique identifier from CRM
  - `rawData`: Complete raw data from CRM for reference
  - `lastSyncedAt`: Timestamp of last CRM sync
  - `syncSource`: Source of the data (always 'CRM')

### WorkingProject Model (`workingProjectModel.js`)

- **Purpose**: Editable copy for daily operations
- **Characteristics**: Can be modified locally, tracks changes
- **Key Fields**:
  - `crmProjectId`: Reference to original CRM data (optional)
  - `hasLocalModifications`: Boolean flag indicating local edits
  - `lastSyncedWithCrm`: Timestamp of last sync with CRM data
  - `modifiedFields`: Array tracking what fields were modified

## How It Works

### 1. CRM Data Import Process

```javascript
// Step 1: Save/Update in CRM collection (original data)
const crmProject = await CrmProject.findOneAndUpdate(
  { externalId: remoteProject._id },
  crmProjectData,
  { upsert: true, new: true }
);

// Step 2: Sync with Working Project (editable copy)
const workingProject = await WorkingProject.syncWithCrmProject(crmProject);
```

### 2. Smart Sync Logic

The `syncWithCrmProject` method implements intelligent syncing:

- **New Projects**: Creates working copy from CRM data
- **Existing Projects without Local Modifications**: Updates all fields
- **Existing Projects with Local Modifications**: Only updates safe fields (like projectStatus)

### 3. Local Modifications Tracking

When any field is modified in WorkingProject:

- `hasLocalModifications` is set to `true`
- The modification is tracked to prevent data loss during sync

### 4. Force Sync Option

Project managers can force sync with CRM data using the `/sync-crm` endpoint:

- Overrides local modifications
- Resets `hasLocalModifications` to `false`
- Updates all fields with latest CRM data

## API Endpoints

### Standard Project Operations

All existing endpoints now work with WorkingProject:

- `GET /api/client-projects` - Get all working projects
- `GET /api/client-projects/:id` - Get single working project
- `PUT /api/client-projects/:id` - Update working project
- `POST /api/client-projects` - Create new working project

### CRM Sync Operations

- `POST /api/client-projects/import-remote` - Import/sync with CRM
- `PUT /api/client-projects/:id/sync-crm` - Force sync single project
- `GET /api/client-projects/sync-status` - Get sync status of all projects

## Benefits

1. **Data Safety**: Local edits are never lost during CRM refresh
2. **Audit Trail**: Track what was modified locally vs. what came from CRM
3. **Flexible Sync**: Choose when to sync with CRM data
4. **Backup**: Original CRM data is always preserved
5. **Conflict Resolution**: Smart merging of CRM updates with local changes

## Migration

Existing projects can be migrated using the provided migration script:

```bash
cd server-OMS
node migrateProjects.js
```

This will:

- Convert existing ClientProject data to WorkingProject
- Mark them as locally modified to preserve edits
- Create backup of original data

## Example Usage

### Check Sync Status

```javascript
GET / api / client - projects / sync - status;
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "projectId": "TT-123",
      "workingProjectId": "...",
      "hasLocalModifications": true,
      "lastSyncedWithCrm": "2025-01-30T10:00:00Z",
      "linkedToCrm": true,
      "crmLastUpdated": "2025-01-30T09:00:00Z"
    }
  ]
}
```

### Force Sync with CRM

```javascript
PUT / api / client - projects / { id } / sync - crm;
```

This will override local changes with latest CRM data.

## Best Practices

1. **Regular Imports**: Schedule regular CRM imports to keep data fresh
2. **Review Modifications**: Check sync status before force syncing
3. **Backup Before Force Sync**: Ensure important local changes are documented
4. **Monitor Sync Status**: Use the sync status endpoint to track data health

## Database Collections

After implementation, you'll have:

- `crmprojects` - Original CRM data
- `workingprojects` - Editable working copies
- `clientprojects` - Legacy collection (can be archived after migration)

This dual-schema approach ensures that your project edits are always preserved while still allowing fresh data from the CRM system.
