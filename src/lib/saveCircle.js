// saveCircle — clone another user's (or the server's) circle into your own.
//
// "Save" is the user-facing verb for what used to be "Copy": it fetches the
// full circle (for its members), creates a new circle of your own with the
// SAME name (not "Copy of ..."), and adds the source's members. Returns the
// new circle's id.

import { extractCircleId } from "./circles.js";

export async function saveCircle(client, circleId) {
  const res = await client.feeds.getCircle({ circleId });
  const c = res?.item || res?.circle || res || null;
  if (!c) throw new Error("Couldn't load that circle.");

  const created = await client.activities.createCircle({
    name: c.name,
    description: c.summary || c.description || undefined,
    icon: c.icon || undefined,
    to: c.to ?? "@public",
  });

  const newId = extractCircleId(created);
  const members = Array.isArray(c.members) ? c.members : [];
  if (newId && members.length) {
    await client.activities.addToCircle({ circleId: newId, members });
  }
  return newId;
}
