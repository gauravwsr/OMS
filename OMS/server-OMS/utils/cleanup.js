// utils/cleanup.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * Cleanup utility for employee deletion
 * Handles deletion of files and face recognition data
 */

const cleanupEmployeeData = async (employee) => {
  const results = {
    faceImagesDeleted: false,
    filesDeleted: false,
    attendanceCleared: false,
    errors: [],
  };

  try {
    // 1. Delete face recognition images from face server
    if (employee.fullName) {
      try {
        const faceDeleteResponse = await axios.delete(
          `http://142.93.213.81:5001/api/delete-user/${encodeURIComponent(
            employee.fullName
          )}`,
          { timeout: 5000 }
        );

        if (faceDeleteResponse.status === 200) {
          results.faceImagesDeleted = true;
          console.log(
            `✅ Face recognition data deleted for: ${employee.fullName}`
          );
        }
      } catch (faceError) {
        results.errors.push(`Face server error: ${faceError.message}`);
        console.error(`❌ Error deleting face images:`, faceError.message);
      }
    }

    // 2. Delete uploaded files (CV, photos)
    const filesToDelete = [];

    if (employee.cvPath && fs.existsSync(employee.cvPath)) {
      filesToDelete.push(employee.cvPath);
    }

    if (employee.photoPath && fs.existsSync(employee.photoPath)) {
      filesToDelete.push(employee.photoPath);
    }

    if (filesToDelete.length > 0) {
      try {
        filesToDelete.forEach((filePath) => {
          fs.unlinkSync(filePath);
          console.log(`✅ File deleted: ${filePath}`);
        });
        results.filesDeleted = true;
      } catch (fileError) {
        results.errors.push(`File deletion error: ${fileError.message}`);
        console.error(`❌ Error deleting files:`, fileError.message);
      }
    }

    // 3. Optional: Clear specific attendance data (if needed)
    // This is handled by the candidate deletion in database
    results.attendanceCleared = true;
  } catch (error) {
    results.errors.push(`General cleanup error: ${error.message}`);
    console.error(`❌ General cleanup error:`, error.message);
  }

  return results;
};

/**
 * Bulk cleanup utility for multiple employees
 */
const bulkCleanupEmployees = async (employees) => {
  const results = {
    totalEmployees: employees.length,
    successfulCleanups: 0,
    failedCleanups: 0,
    errors: [],
  };

  for (const employee of employees) {
    try {
      const cleanupResult = await cleanupEmployeeData(employee);
      if (cleanupResult.errors.length === 0) {
        results.successfulCleanups++;
      } else {
        results.failedCleanups++;
        results.errors.push(
          `${employee.fullName}: ${cleanupResult.errors.join(", ")}`
        );
      }
    } catch (error) {
      results.failedCleanups++;
      results.errors.push(`${employee.fullName}: ${error.message}`);
    }
  }

  return results;
};

/**
 * Check disk space usage for face recognition images
 */
const getFaceRecognitionDiskUsage = async () => {
  try {
    const response = await axios.get("http://142.93.213.81:5001/api/disk-usage");
    return response.data;
  } catch (error) {
    console.error("Error getting disk usage:", error.message);
    return { error: error.message };
  }
};

/**
 * Clean orphaned files (files without corresponding database entries)
 */
const cleanOrphanedFiles = async (allEmployees) => {
  const results = {
    orphanedFiles: [],
    deletedFiles: [],
    errors: [],
  };

  // Get all employee names from database
  const employeeNames = allEmployees.map((emp) => emp.fullName);

  try {
    // Check face recognition server for registered users
    const response = await axios.get(
      "http://142.93.213.81:5001/api/registered-users"
    );
    if (response.data && response.data.users_with_images) {
      // Find orphaned face recognition folders
      const orphanedFaceUsers = response.data.users_with_images.filter(
        (user) => !employeeNames.includes(user.name)
      );

      // Delete orphaned face recognition data
      for (const orphanedUser of orphanedFaceUsers) {
        try {
          await axios.delete(
            `http://142.93.213.81:5001/api/delete-user/${encodeURIComponent(
              orphanedUser.name
            )}`
          );
          results.deletedFiles.push(`Face data: ${orphanedUser.name}`);
        } catch (deleteError) {
          results.errors.push(
            `Failed to delete face data for ${orphanedUser.name}: ${deleteError.message}`
          );
        }
      }

      results.orphanedFiles = orphanedFaceUsers.map((user) => user.name);
    }
  } catch (error) {
    results.errors.push(`Error checking orphaned files: ${error.message}`);
  }

  return results;
};

module.exports = {
  cleanupEmployeeData,
  bulkCleanupEmployees,
  getFaceRecognitionDiskUsage,
  cleanOrphanedFiles,
};
