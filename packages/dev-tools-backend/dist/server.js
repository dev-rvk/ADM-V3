"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const getRootPath_1 = require("./utils/getRootPath");
const execCommand_1 = require("./utils/execCommand");
const readNestedDir_1 = require("./utils/readNestedDir");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const { DEV_TOOLS_BACKEND_PORT } = require("config");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const PORT = DEV_TOOLS_BACKEND_PORT;
function getMulterUpload(destination) {
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    });
    return (0, multer_1.default)({ storage });
}
app.get("/", (req, res) => {
    res.json({ version: "0.0.1" });
});
app.post("/decompile_jadx", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadsPath = (0, getRootPath_1.getRootPath)("workers/jadx_decompile/uploads");
    const outputPath = (0, getRootPath_1.getRootPath)("workers/jadx_decompile/output");
    const upload = getMulterUpload(uploadsPath).single("apkfile");
    upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.status(500).send(`File upload failed Error ${err}`);
        }
        const apkFile = req.file;
        if (!apkFile) {
            return res.status(400).send("No file uploaded.");
        }
        // Execute the commands to decompile APK
        const command = `docker run -v ${uploadsPath}:/app/uploads -v ${outputPath}:/app/output jadx-decompile ${apkFile.filename}`;
        const result = yield (0, execCommand_1.execCommand)(command);
        if (!result.success) {
            return res.status(500).send(result.message);
        }
        const apkName = apkFile.filename.replace(".apk", "");
        const decompDir = path_1.default.join(outputPath, apkName);
        // Read the output directory to get the list of generated files
        const files = (0, readNestedDir_1.readNestedDir)(decompDir, outputPath);
        // Generate URLs for the generated files
        const fileUrls = files
            .filter((file) => file !== ".gitkeep" && !/^\..*$/.test(file))
            .map((file) => ({
            filename: path_1.default.basename(file),
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
    }));
}));
app.post("/decompile_so", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    /*
  Accepted Response:
  {
    'sofile': uploaded so file,
    'selections': ['angr', 'ghidra'] or ['angr']
  }
   */
    const uploadsPath = (0, getRootPath_1.getRootPath)("workers/so_decompiler/uploads");
    const outputPath = (0, getRootPath_1.getRootPath)("workers/so_decompiler/output");
    const upload = getMulterUpload(uploadsPath).single("sofile");
    upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else if (selections.includes("angr")) {
            argument = "angr";
        }
        else if (selections.includes("ghidra")) {
            argument = "ghidra";
        }
        else {
            return res.status(400).send("Invalid selections.");
        }
        // Execute the commands to decompile SO file
        const command = `docker run -v ${uploadsPath}:/decompile/uploads -v ${outputPath}:/decompile/output devrvk/so-decompiler ${argument} /decompile/uploads/${soFile.filename} /decompile/output`;
        const result = yield (0, execCommand_1.execCommand)(command);
        // if the command failed, return the error message
        if (!result.success) {
            return res.status(500).send(result.message);
        }
        // Read the output directory to get the list of generated files
        const files = fs_1.default.readdirSync(outputPath);
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
    }));
}));
// Static Resource Serving
app.use("/static/so", express_1.default.static((0, getRootPath_1.getRootPath)("workers/so_decompiler/output")));
app.use("/static/apk", express_1.default.static((0, getRootPath_1.getRootPath)("workers/jadx_decompile/output")));
app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
});
