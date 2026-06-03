// GroupAvatar — visually identical to a circle avatar (square hard edges,
// Users-icon fallback). Separate component name so call sites read naturally.

import { CircleAvatar } from "../circles/CircleAvatar.jsx";

export function GroupAvatar({ group, size, baseUrl }) {
  return <CircleAvatar circle={group} size={size} baseUrl={baseUrl} />;
}
