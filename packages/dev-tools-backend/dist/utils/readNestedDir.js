"use strict";
/*
This function reads all files from a given directory and its subdirectories recursively,
returning their relative paths with respect to a base directory. It collects the paths
of all files found in the directory tree and stores them in an array.

Parameters:
-----------
dir: string
    The initial directory to start reading from. This directory and all its subdirectories
    will be scanned for files.
    
baseDir: string
    The base directory used to compute the relative paths of the files. All paths returned
    will be relative to this directory.

Returns:
-----------
string[]
    An array of relative file paths with respect to the base directory. Each element in
    the array is a path to a file found within the directory tree.
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNestedDir = readNestedDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function readNestedDir(dir, baseDir) {
    const files = [];
    const readDirRecursive = (currentDir) => {
        const items = fs_1.default.readdirSync(currentDir);
        items.forEach(item => {
            const fullPath = path_1.default.join(currentDir, item);
            const relativePath = path_1.default.relative(baseDir, fullPath);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isDirectory()) {
                readDirRecursive(fullPath);
            }
            else {
                files.push(relativePath);
            }
        });
    };
    readDirRecursive(dir);
    return files;
}
