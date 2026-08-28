import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { requestUploadSchema } from "@/lib/contracts/video";
import { createPresignedUpload } from "@/lib/storage";

/** Step 1 of uploading a video: get a short-lived URL to PUT the file straight to storage, then POST /api/videos with the resulting key. */
export const POST = route(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = requestUploadSchema.parse(await req.json());

  const folder = body.contentType.startsWith("image/") ? "video-thumbnails" : "videos";
  const upload = await createPresignedUpload(folder, body.contentType);

  return NextResponse.json(upload);
});
