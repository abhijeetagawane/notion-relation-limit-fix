/**
 * notion-relation-batcher.js
 * 
 * A utility to bypass the Notion API 25-item limit when updating relation properties.
 * It sequences writes in safe batches of 25 to prevent 429 Rate Limits and payload rejections.
 */

const { Client } = require("@notionhq/client");

// Initialize the Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Pure utility to slice an array into smaller sub-arrays of a specific size.
 */
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

/**
 * Optional Safety Filter: 
 * Prevents execution halts by removing deleted, archived, or invalid page IDs 
 * before the batch update begins.
 */
async function filterValidIds(notionClient, ids) {
  const checks = await Promise.allSettled(
    ids.map((id) => notionClient.pages.retrieve({ page_id: id }))
  );
  
  return checks
    .filter((r) => r.status === "fulfilled" && !r.value.archived)
    .map((r) => r.value.id);
}

/**
 * Core Batching Function:
 * Writes an array of relation IDs to a Notion page in sequential batches of 25.
 * Fetches the current page state on subsequent loops to prevent overwriting previous batches.
 */
async function batchSetRelation(pageId, propName, allIds) {
  // The Notion API rejects relation payloads larger than 25 items
  const batches = chunk(allIds, 25);
  
  for (let i = 0; i < batches.length; i++) {
    // If it's not the first batch, fetch the live page to retain what was just written
    const existing =
      i > 0
        ? (await notion.pages.retrieve({ page_id: pageId })).properties[propName].relation
        : [];
        
    // Execute the write
    await notion.pages.update({
      page_id: pageId,
      properties: {
        [propName]: {
          relation: [...existing, ...batches[i].map((id) => ({ id }))],
        },
      },
    });
    
    console.log(`Successfully wrote batch ${i + 1} of ${batches.length}`);
  }
}

// ==========================================
// EXAMPLE EXECUTION
// ==========================================

/*
(async () => {
  const targetPageId = "your-target-page-id";
  const relationPropertyName = "Enrolled Employees";
  const rawEmployeeIds = [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    // ... 100+ more IDs
  ];

  try {
    // 1. Clean the IDs to prevent "Could not find page" errors
    const validIds = await filterValidIds(notion, rawEmployeeIds);
    
    // 2. Execute the batched write
    await batchSetRelation(targetPageId, relationPropertyName, validIds);
    
    console.log("All relations successfully synced.");
  } catch (error) {
    console.error("Failed to sync relations:", error.message);
  }
})();
*/
