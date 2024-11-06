import express from "express";
import { getRootPath } from "./utils/getRootPath";
import { execCommand } from "./utils/execCommand";
import { readNestedDir } from "./utils/readNestedDir";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";

const { DEV_TOOLS_BACKEND_PORT } = require("config");

const app = express();
app.use(cors());
const PORT = DEV_TOOLS_BACKEND_PORT;

function getMulterUpload(destination: string) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    });

    return multer({ storage });
}

app.get("/", (req, res) => {
    res.json({ version: "0.0.1" });
});

app.post("/decompile_jadx", async (req, res) => {
    const uploadsPath = getRootPath("workers/jadx_decompile/uploads");
    const outputPath = getRootPath("workers/jadx_decompile/output");

    const upload = getMulterUpload(uploadsPath).single("apkfile");

    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send(`File upload failed Error ${err}`);
        }

        const apkFile = req.file;
        if (!apkFile) {
            return res.status(400).send("No file uploaded.");
        }

        // Execute the commands to decompile APK
        const command = `docker run -v ${uploadsPath}:/app/uploads -v ${outputPath}:/app/output jadx-decompile ${apkFile.filename}`;

        const result = await execCommand(command);

        if (!result.success) {
            return res.status(500).send(result.message);
        }

        const apkName = apkFile.filename.replace(".apk", "");
        const decompDir = path.join(outputPath, apkName);

        // Read the output directory to get the list of generated files
        const files = readNestedDir(decompDir, outputPath);

        // Generate URLs for the generated files
        const fileUrls = files
            .filter((file) => file !== ".gitkeep" && !/^\..*$/.test(file))
            .map((file) => ({
                filename: path.basename(file),
                path: file,
                url: `http://localhost:${PORT}/static/apk/${file}`,
            }));

        res.json({ files: fileUrls });

        // {
        //   "files": [
        //       {
        //           "filename": "AndroidManifest.xml",
        //           "path": "test/resources/AndroidManifest.xml",
        //           "url": "http://localhost:9000/static/apk/test/resources/AndroidManifest.xml"
        //       },
        //       {
        //         "filename": "drawables.xml",
        //         "path": "test/resources/res/values-ldrtl-xxxhdpi/drawables.xml",
        //         "url": "http://localhost:9000/static/apk/test/resources/res/values-ldrtl-xxxhdpi/drawables.xml"
        //     }
        //   ]
        // }
    });
});

app.post("/decompile_so", async (req, res) => {
    /*
  Accepted Response:
  {
    'sofile': uploaded so file,
    'selections': ['angr', 'ghidra'] or ['angr']
  }
   */
    const uploadsPath = getRootPath("workers/so_decompiler/uploads");
    const outputPath = getRootPath("workers/so_decompiler/output");

    const upload = getMulterUpload(uploadsPath).single("sofile");

    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res
                .status(500)
                .send(`File upload failed. Error: ${err.message}`);
        }

        const soFile = req.file;
        if (!soFile) {
            return res.status(400).send("No file uploaded.");
        }

        const selections = req.body.selections || [];
        let argument;
        if (selections.includes("angr") && selections.includes("ghidra")) {
            argument = "decompile";
        } else if (selections.includes("angr")) {
            argument = "angr";
        } else if (selections.includes("ghidra")) {
            argument = "ghidra";
        } else {
            return res.status(400).send("Invalid selections.");
        }

        // Execute the commands to decompile SO file
        const command = `docker run -v ${uploadsPath}:/decompile/uploads -v ${outputPath}:/decompile/output devrvk/so-decompiler ${argument} /decompile/uploads/${soFile.filename} /decompile/output`;

        const result = await execCommand(command);

        // if the command failed, return the error message
        if (!result.success) {
            return res.status(500).send(result.message);
        }

        // Read the output directory to get the list of generated files
        const files = fs.readdirSync(outputPath);

        // Generate URLs for the generated files
        const fileUrls = files
            .filter((file) => file !== ".gitkeep" && !/^\..*$/.test(file))
            .map((file) => ({
                filename: file,
                url: `http://localhost:${PORT}/static/so/${file}`,
            }));
        res.json({ files: fileUrls });

        // Sample Response
        //   {
        //     "files": [
        //         {
        //             "filename": "out_angr.c",
        //             "url": "http://localhost:9000/static/so/out_angr.c"
        //         },
        //         {
        //             "filename": "out_ghidra.c",
        //             "url": "http://localhost:9000/static/so/out_ghidra.c"
        //         },
        //         {
        //             "filename": "out_ghidra.h",
        //             "url": "http://localhost:9000/static/so/out_ghidra.h"
        //         }
        //     ]
        // }
    });
});

// Static Resource Serving
app.use(
    "/static/so",
    express.static(getRootPath("workers/so_decompiler/output")),
);
app.use(
    "/static/apk",
    express.static(getRootPath("workers/jadx_decompile/output")),
);

app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
});
