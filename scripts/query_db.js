const { queryResumes } = require("../services/dbService");

async function checkQueryResumes() {
  try {
    const results = await queryResumes({
      userId: "345b3671-a205-4854-8650-3a42ddc720ac",
      limit: 3,
      sortBy: "updated_at",
      sortOrder: "desc",
      filterStatus: "all"
    });

    console.log("=== queryResumes Results ===");
    console.log(results);
  } catch (err) {
    console.error("queryResumes failed:", err);
  }
}

checkQueryResumes();
