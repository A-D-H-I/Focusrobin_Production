import { NextResponse } from "next/server";
import { testS3Connection } from "@/lib/s3";

export async function GET() {
  try {
    console.log("[S3 Test] Starting S3 connection test...");
    
    const isConnected = await testS3Connection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "S3 connection successful! ✅",
        details: {
          bucket: process.env.AWS_S3_BUCKET_NAME,
          region: process.env.AWS_S3_REGION,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "S3 connection failed ❌",
        error: "Check your environment variables and AWS configuration",
        required: {
          AWS_S3_REGION: process.env.AWS_S3_REGION || "NOT SET",
          AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "NOT SET",
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "SET ✓" : "NOT SET",
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "SET ✓" : "NOT SET",
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[S3 Test] Error:", error);
    return NextResponse.json({
      success: false,
      message: "S3 test failed",
      error: error.message,
      required: {
        AWS_S3_REGION: process.env.AWS_S3_REGION || "NOT SET",
        AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "NOT SET",
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "SET ✓" : "NOT SET",
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "SET ✓" : "NOT SET",
      }
    }, { status: 500 });
  }
}
















