const mongoose = require("mongoose");
const ClientProject = require("./models/clientProjectModel");
const WorkingProject = require("./models/workingProjectModel");

// Migration script to convert existing ClientProject data to WorkingProject
async function migrateExistingProjects() {
  try {
    console.log("Starting migration of existing projects...");

    // Connect to MongoDB (adjust connection string as needed)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost27017/oms",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
    }

    // Get all existing ClientProjects
    const existingProjects = await ClientProject.find({});
    console.log(
      `Found ${existingProjects.length} existing projects to migrate`
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const project of existingProjects) {
      try {
        // Check if already migrated
        const existingWorkingProject = await WorkingProject.findOne({
          externalId: project.externalId || `MIGRATED-${project._id}`,
        });

        if (existingWorkingProject) {
          console.log(
            `Skipping already migrated project: ${project.projectId}`
          );
          skippedCount++;
          continue;
        }

        // Create working project from existing client project
        const workingProjectData = {
          ...project.toObject(),
          _id: undefined, // Let MongoDB generate new ID
          externalId: project.externalId || `MIGRATED-${project._id}`,
          crmProjectId: null, // No CRM link for existing projects
          hasLocalModifications: true, // Mark as modified since they're existing data
          lastSyncedWithCrm: null,
          modifiedFields: [
            {
              fieldName: "migrated",
              modifiedAt: new Date(),
              modifiedBy: null,
            },
          ],
        };

        const workingProject = new WorkingProject(workingProjectData);
        await workingProject.save();

        console.log(
          `Migrated project: ${project.projectId} -> ${workingProject._id}`
        );
        migratedCount++;
      } catch (projectError) {
        console.error(
          `Error migrating project ${project.projectId}:`,
          projectError.message
        );
      }
    }

    console.log(`Migration completed!`);
    console.log(`- Migrated: ${migratedCount} projects`);
    console.log(`- Skipped: ${skippedCount} projects`);
    console.log(`- Total processed: ${migratedCount + skippedCount} projects`);

    // Optional: Create backup collection of original data
    console.log("Creating backup of original ClientProject collection...");
    await mongoose.connection.db
      .collection("clientprojects")
      .aggregate([{ $out: "clientprojects_backup_" + Date.now() }])
      .toArray();
    console.log("Backup created successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingProjects()
    .then(() => {
      console.log("Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateExistingProjects };
