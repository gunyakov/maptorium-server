//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from "express";
const router = express.Router();
router.use(express.json({ limit: "20mb" }));
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//Pro mode "User Styles" handler
//------------------------------------------------------------------------------
import UserStyles from "../src/userStyles";
//------------------------------------------------------------------------------
//MARKS: Get saved styles list (id/name/dates only)
//------------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const list = await UserStyles.list();
  if (list) {
    res.json({ result: "success", data: list });
  } else {
    res.json({ result: "error", message: "request.userStyles.list.empty" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Get one saved style (with full style JSON) by ID
//------------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const ID = parseInt(req.params.id);
  if (!(ID > 0)) {
    res.json({ result: "warning", message: "request.userStyles.get.id_invalid" });
    return;
  }
  const style = await UserStyles.get(ID);
  if (style) {
    res.json({ result: "success", data: style });
  } else {
    res.json({ result: "error", message: "request.userStyles.get.not_found" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Save (insert or overwrite by name) a style snapshot
//------------------------------------------------------------------------------
router.post("/save", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const style = req.body.style;

    if (!name) {
      res.json({ result: "warning", message: "request.userStyles.save.name_invalid" });
      return;
    }
    if (typeof style !== "object" || style === null) {
      res.json({ result: "warning", message: "request.userStyles.save.style_invalid" });
      return;
    }

    const result = await UserStyles.save(name, JSON.stringify(style));
    if (typeof result === "number") {
      res.json({
        result: "success",
        message: "request.userStyles.save.success",
        data: { ID: result },
      });
    } else {
      res.json({ result: "error", message: "request.userStyles.save.failed" });
    }
  } catch (e) {
    Log.error(LogModules.poi, "USER STYLE SAVE REQUEST: " + (e as Error)?.message);
    res.json({ result: "error", message: "request.userStyles.save.exception" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Delete a saved style
//------------------------------------------------------------------------------
router.post("/delete", async (req, res) => {
  const ID = parseInt(req.body.ID);
  if (!(ID > 0)) {
    res.json({ result: "warning", message: "request.userStyles.delete.id_invalid" });
    return;
  }
  if (await UserStyles.delete(ID)) {
    res.json({ result: "success", message: "request.userStyles.delete.success" });
  } else {
    res.json({ result: "error", message: "request.userStyles.delete.failed" });
  }
});

export default router;
