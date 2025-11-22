import fs from 'fs';
import path from 'path';
import config from '../config/config';

function getFilePath(filename: string): string {
    return path.join(config.filesPath, filename);
}

export async function createFile(filename: string, data: any): Promise<void> {
    const filePath = getFilePath(filename);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, data, { flag: 'wx' });
}

export async function deleteFile(filename: string): Promise<void> {
    const filePath = getFilePath(filename);
    try {
        await fs.promises.unlink(filePath);
    } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
        // File does not exist, ignore
    }
}

export async function fileExists(filename: string): Promise<boolean> {
    const filePath = getFilePath(filename);
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function readFile(filename: string): Promise<Buffer> {
    const filePath = getFilePath(filename);
    return await fs.promises.readFile(filePath);
}
