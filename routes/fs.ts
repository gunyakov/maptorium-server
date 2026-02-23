import express from "express";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

type FsNodeType = "file" | "folder";

function toAbsolutePath(inputPath: string) {
  return path.resolve(String(inputPath || "/").trim() || "/");
}

router.get("/current", async (_req, res) => {
  res.json({
    result: "success",
    data: {
      path: process.cwd(),
    },
  });
});

router.post("/list", async (req, res) => {
  try {
    const targetPath = toAbsolutePath(req.body?.path || "/");

    if (!existsSync(targetPath)) {
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
    const parentPath = toAbsolutePath(req.body?.path || "/");
    const folderName = String(req.body?.name || "").trim();

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
    const currentPath = toAbsolutePath(req.body?.path || "");
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
