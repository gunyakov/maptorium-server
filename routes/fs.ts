import express from "express";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

type FsNodeType = "file" | "folder";

const isWindows = process.platform === "win32";

// Windows has no single filesystem root (paths start with a drive letter,
// e.g. "C:\"), so the tree's synthetic root lists available drives there
// instead of listing "/" like on POSIX platforms.
function isRootSentinel(inputPath: string) {
  return !inputPath || inputPath === "/" || inputPath === "\\";
}

async function listWindowsDrives(): Promise<
  { name: string; path: string; type: FsNodeType }[]
> {
  const drives: { name: string; path: string; type: FsNodeType }[] = [];
  for (let code = 65; code <= 90; code++) {
    const drivePath = `${String.fromCharCode(code)}:\\`;
    if (existsSync(drivePath)) {
      drives.push({ name: drivePath, path: drivePath, type: "folder" });
    }
  }
  return drives;
}

// Absolute-path guard for a path coming straight from the client. Unlike
// path.resolve(), this never silently reinterprets an unrecognized path as
// relative to the server's cwd — an invalid path is rejected outright.
function toValidAbsolutePath(inputPath: string): string | null {
  const normalized = path.normalize(String(inputPath || "").trim());
  if (!normalized || !path.isAbsolute(normalized)) return null;
  return normalized;
}

router.get("/current", async (_req, res) => {
  // process.cwd() is not a meaningful starting point once packaged (it
  // depends on how the app was launched); the user's home directory is.
  res.json({
    result: "success",
    data: {
      path: os.homedir(),
    },
  });
});

router.post("/list", async (req, res) => {
  try {
    const rawPath = String(req.body?.path ?? "");

    if (isWindows && isRootSentinel(rawPath)) {
      return res.json({ result: "success", data: await listWindowsDrives() });
    }

    const targetPath = toValidAbsolutePath(rawPath || "/");
    if (!targetPath || !existsSync(targetPath)) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.read_folder",
      });
    }

    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.read_folder",
      });
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true });

    const items = entries
      .map((entry) => {
        const nodeType: FsNodeType = entry.isDirectory() ? "folder" : "file";
        return {
          name: entry.name,
          path: path.join(targetPath, entry.name),
          type: nodeType,
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return res.json({ result: "success", data: items });
  } catch (error: any) {
    return res.json({
      result: "error",
      message: "dialog.filesystem_tree.errors.read_folder",
    });
  }
});

router.post("/create", async (req, res) => {
  try {
    const parentPath = toValidAbsolutePath(req.body?.path || "");
    const folderName = String(req.body?.name || "").trim();

    if (!parentPath) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.create_folder",
      });
    }

    if (!folderName) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.create_folder",
      });
    }

    if (folderName.includes("/") || folderName.includes("\\")) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.create_folder",
      });
    }

    const folderPath = path.join(parentPath, folderName);
    await fs.mkdir(folderPath, { recursive: false });

    return res.json({
      result: "success",
      data: { path: folderPath },
      message: "dialog.filesystem_tree.create.title",
    });
  } catch (error: any) {
    return res.json({
      result: "error",
      message: "dialog.filesystem_tree.errors.create_folder",
    });
  }
});

router.post("/rename", async (req, res) => {
  try {
    const currentPath = toValidAbsolutePath(req.body?.path || "");
    const nextName = String(req.body?.newName || "").trim();

    if (!currentPath || !nextName) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.rename_folder",
      });
    }

    if (nextName.includes("/") || nextName.includes("\\")) {
      return res.json({
        result: "error",
        message: "dialog.filesystem_tree.errors.rename_folder",
      });
    }

    const nextPath = path.join(path.dirname(currentPath), nextName);
    await fs.rename(currentPath, nextPath);

    return res.json({
      result: "success",
      data: { path: nextPath },
      message: "dialog.filesystem_tree.rename.title",
    });
  } catch (error: any) {
    return res.json({
      result: "error",
      message: "dialog.filesystem_tree.errors.rename_folder",
    });
  }
});

export default router;
