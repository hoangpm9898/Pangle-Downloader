const fs = require('fs').promises;
const path = require('path');

async function deleteFolderFromFilePath(filePath) {
    try {
        const folderPath = path.dirname(filePath);
        try {
            await fs.access(folderPath);
        } catch (err) {
            return true;
        }
        await fs.rm(folderPath, { recursive: true, force: true });
        return true;
    } catch (err) {
    }
    return false;
}

module.exports = { deleteFolderFromFilePath };