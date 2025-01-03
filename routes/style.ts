//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const ExecFolder = process.cwd();

const path = require("path");

import fs from "node:fs";

router.post("/:name/:style", async function (req, res) {
  const staticFile = path.join(
    ExecFolder,
    "..",
    "maptorium-maplibre",
    "styles",
    req.params.name,
    req.params.style
  );

  return res.send(fs.readFileSync(staticFile));
});

export default router;
