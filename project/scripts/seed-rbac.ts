import { db } from "@/lib/db";
import { roles, permissions, rolePermissions } from "@/lib/db/schema";

const ROLES_TO_SEED = [
  { name: "Project Manager" },
  { name: "QA Engineer" },
  { name: "Software Developer" },
  { name: "UI/UX Designer" },
  { name: "Business Analyst" },
  { name: "Standard User" },
];

const PERMISSIONS_TO_SEED = [
  { action: "project:create" },
  { action: "project-invite:create" },
  { action: "task:create" },
  { action: "task:edit" },
];

const ROLE_MAPPINGS = {
  "Project Manager": ["project:create", "project-invite:create", "task:create", "task:edit"],
  "QA Engineer": ["task:create", "task:edit"],
  "Software Developer": ["task:create", "task:edit"],
  "UI/UX Designer": ["task:create", "task:edit"],
  "Business Analyst": ["task:create", "task:edit"],
  "Standard User": [],
};

export async function seedRBAC() {
  console.log("Starting RBAC Seed...");
  try {
    await db.insert(roles).values(ROLES_TO_SEED).onConflictDoNothing({ target: roles.name });
    await db.insert(permissions).values(PERMISSIONS_TO_SEED).onConflictDoNothing({ target: permissions.action });

    const dbRoles = await db.select().from(roles);
    const dbPermissions = await db.select().from(permissions);
    const junctionInserts = [];

    for (const [roleName, actionList] of Object.entries(ROLE_MAPPINGS)) {
      const roleRecord = dbRoles.find(r => r.name === roleName);
      if (!roleRecord) continue;

      for (const action of actionList) {
        const permRecord = dbPermissions.find(p => p.action === action);
        if (!permRecord) continue;

        junctionInserts.push({ roleId: roleRecord.id, permissionId: permRecord.id });
      }
    }

    if (junctionInserts.length > 0) {
      await db.insert(rolePermissions).values(junctionInserts).onConflictDoNothing();
    }
    console.log("RBAC Seeding Complete!");
  } catch (error) {
    console.error("Error seeding RBAC:", error);
  }
}

seedRBAC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });