import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { requestUploadSchema } from "@/lib/validation/video";
import { createPresignedUpload } from "@/lib/storage";

/** Step 1 of uploading a video: get a short-lived URL to PUT the file straight to R2, then POST /api/videos with the resulting publicUrl. */
export const POST = withApi(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = requestUploadSchema.parse(await req.json());

  const folder = body.contentType.startsWith("image/") ? "video-thumbnails" : "videos";
  const upload = await createPresignedUpload(folder, body.contentType);

  return NextResponse.json(upload);
});
