import { NextResponse } from "next/server";
import { isTranslationAvailable } from "@/lib/translation";
import { readFileSync } from "fs";
import path from "path";

/**
 * Test endpoint to verify translation setup
 * GET /api/translate/test
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check environment variable
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  results.checks.envVariable = {
    exists: !!credentialsPath,
    value: credentialsPath ? credentialsPath : "Not set",
  };

  // Check if file exists
  if (credentialsPath) {
    let resolvedPath = credentialsPath;
    if (credentialsPath.startsWith('./') || credentialsPath.startsWith('../')) {
      resolvedPath = path.resolve(process.cwd(), credentialsPath);
    }
    
    try {
      const fs = require('fs');
      const exists = fs.existsSync(resolvedPath);
      results.checks.fileExists = {
        exists,
        path: resolvedPath,
        absolute: path.isAbsolute(resolvedPath),
      };

      if (exists) {
        // Try to read and parse JSON
        try {
          const content = fs.readFileSync(resolvedPath, 'utf8');
          const json = JSON.parse(content);
          results.checks.fileValid = {
            valid: true,
            hasProjectId: !!json.project_id,
            hasClientEmail: !!json.client_email,
            hasPrivateKey: !!json.private_key,
            projectId: json.project_id,
          };
        } catch (parseError) {
          results.checks.fileValid = {
            valid: false,
            error: parseError instanceof Error ? parseError.message : "Unknown error",
          };
        }
      }
    } catch (error) {
      results.checks.fileExists = {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Check if translation API is available
  try {
    const available = isTranslationAvailable();
    results.checks.apiAvailable = {
      available,
    };
  } catch (error) {
    results.checks.apiAvailable = {
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return NextResponse.json(results, {
    status: 200,
  });
}





