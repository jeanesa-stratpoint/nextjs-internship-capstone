import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  taskAttachment: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }, pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl); 
      return { uploadedBy: metadata.userId, url: file.ufsUrl }; 
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;