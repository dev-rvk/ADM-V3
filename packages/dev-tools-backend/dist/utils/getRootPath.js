"use strict";
/*
This function returns a absolute path to the file/directory.
Parameters:
-----------
- relativePath: string - The relative path to the directory ot file

Returns:
-----------
- string - The absolute path to the directory or file.
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootPath = getRootPath;
const path_1 = __importDefault(require("path"));
function getRootPath(relativePath) {
    const projectRoot = process.cwd();
    const resolvedPath = path_1.default.resolve(projectRoot, relativePath);
    return resolvedPath;
}
