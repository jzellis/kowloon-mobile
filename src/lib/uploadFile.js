// Upload a local file (from expo-image-picker, expo-document-picker, etc.)
// through @kowloon/client's files.upload. Type-agnostic — handles images,
// audio, video, or anything else the server's file pipeline accepts.
//
// The client library's upload constructs FormData. For React Native, the
// `file` field is most reliably appended as `{ uri, name, type }` rather
// than a Blob or Buffer; RN's fetch knows how to send that shape.
//
// Returns the server's upload response: { ok, file: { id, url, thumbnails, metadata } }.

export async function uploadFile(
  client,
  {
    uri,
    name,
    mimeType,
    title,
    summary,
    to,
    parentObject,
    generateThumbnail,
    thumbnailSizes,
  }
) {
  if (!client) throw new Error("uploadFile: no client");
  if (!uri) throw new Error("uploadFile: uri is required");

  const filename = name || `upload-${Date.now()}`;
  const contentType = mimeType || "application/octet-stream";

  // RN FormData accepts this shape directly. The client library falls
  // through to `formData.append('file', file, filename)` for non-Blob /
  // non-Buffer inputs, so RN's native handling kicks in.
  const filePart = { uri, name: filename, type: contentType };

  return await client.files.upload({
    file: filePart,
    filename,
    contentType,
    title,
    summary,
    to,
    parentObject,
    generateThumbnail,
    thumbnailSizes,
  });
}
