# Notion Relation Limit Fix (API Batcher)

When updating Notion databases via the `@notionhq/client` API, any `pages.update()` call containing a relation array larger than 25 items will be rejected with an `APIResponseError`.

This repository contains the JavaScript utility to automatically chunk your relation IDs into safe batches of 25, preventing the 429 Rate Limit error and bypassing the relation ceiling. 

## How to use it
1. Import the `notion-relation-batcher.js` file.
2. Pass your target `pageId`, the `propertyName`, and your full array of relation IDs.
3. The script will safely sequence the writes without overwriting previous batches.

## Full Documentation & Structural Fixes
If you are dealing with large datasets (100+ relations) where the inline Notion UI begins to hide the `+` button, batched API calls are only a temporary fix. You will need to restructure your database. 

For a complete breakdown of this code, and the **no-code Junction Database workaround**, read the full technical guide here: 
[Notion Relation Limit Exceeded Error: 3 Fixes That Work](https://gridandformula.com/fix-notion-relation-limit-exceeded-error-instantly)
