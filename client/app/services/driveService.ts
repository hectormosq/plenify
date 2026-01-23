import { plenifyService } from "./index";

const FILE_NAME = "plenify_backup.json.enc";

export type SyncStatus = "synced" | "local_ahead" | "local_behind" | "unknown";

export class DriveService {
  private static instance: DriveService;

  private constructor() {}

  static getInstance(): DriveService {
    if (!DriveService.instance) {
      DriveService.instance = new DriveService();
    }
    return DriveService.instance;
  }

  // --- GOOGLE DRIVE API CALLS ---

  /**
   * Search for the backup file on Google Drive.
   * Returns metadata if found, null otherwise.
   */
  async findBackupFile(accessToken: string): Promise<{ id: string; modifiedTime: string; appProperties?: { lastUpdated?: string } } | null> {
    const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id, modifiedTime, appProperties)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) throw new Error("Failed to search Drive files");
    const data = await response.json();

    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  }

  /**
   * Upload (Create or Update) the backup file to Google Drive.
   */
  async uploadBackup(accessToken: string, fileId?: string): Promise<string> {
    // 1. Get current data
    const rawData = plenifyService.exportDb(); 
    const lastUpdated = plenifyService.getSetting("lastUpdated") || Date.now();

    const metadata = {
      name: FILE_NAME,
      mimeType: "application/json",
      appProperties: {
        lastUpdated: lastUpdated.toString()
      }
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append(
      "file",
      new Blob([rawData], { type: "application/json" })
    );

    let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    let method = "POST";

    if (fileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = "PATCH";
    }

    const response = await fetch(url, {
      method: method,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Upload failed: ${err}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Download and restore the backup file.
   */
  async downloadBackup(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) throw new Error("Failed to download file");
    
    const content = await response.text();
    
    // RESTORE DB
    await plenifyService.importDb(content);
  }

  // --- SYNC LOGIC ---
  // TODO: Add comparison logic (Phase 4.3)
}

export const driveService = DriveService.getInstance();
