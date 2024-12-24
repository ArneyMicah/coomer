// 修改名称
import fs from 'fs';
import path from 'path';

// 获取主文件夹路径
const mainFolderPath = 'D:/nana_taipei'; // 你的主文件夹路径

// 遍历并修改所有子文件夹的名称及其中文件的名称
function renameFolderAndFiles(mainFolderPath) {
    // 读取主文件夹中的内容
    fs.readdir(mainFolderPath, (err, files) => {
        if (err) {
            console.error('读取文件夹失败:', err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(mainFolderPath, file);

            // 获取文件或文件夹的状态
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('获取文件信息失败:', err);
                    return;
                }

                // 如果是子文件夹，处理文件夹和文件
                if (stats.isDirectory()) {
                    // 修改文件夹名称
                    const newFolderName = file
                        .replace('T', ' ')    // 将 'T' 替换为空格
                        .replace(/_/g, '-');  // 将所有的 '_' 替换为 '-'

                    const newFolderPath = path.join(mainFolderPath, newFolderName);

                    // 重命名文件夹
                    fs.rename(filePath, newFolderPath, (err) => {
                        if (err) {
                            console.error('重命名文件夹失败:', err);
                            return;
                        }
                        console.log(`文件夹 '${file}' 重命名为 '${newFolderName}'`);

                        // 处理该文件夹中的所有文件
                        processFilesInFolder(newFolderPath, newFolderName);

                        // 检查并移除空文件夹
                        removeEmptyFolder(newFolderPath);
                    });
                }
            });
        });
    });
}

// 处理文件夹中的文件，将文件名根据文件夹名称进行修改
function processFilesInFolder(folderPath, folderName) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('读取文件夹内容失败:', err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);

            // 获取文件状态
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('获取文件信息失败:', err);
                    return;
                }

                if (stats.isFile()) {
                    // 获取文件扩展名
                    const fileExtension = path.extname(file);

                    // 新的文件名为 文件夹名称 + 文件的扩展名
                    const newFileName = `${folderName}${fileExtension}`;
                    const newFilePath = path.join(folderPath, newFileName);

                    // 重命名文件
                    fs.rename(filePath, newFilePath, (err) => {
                        if (err) {
                            console.error('重命名文件失败:', err);
                            return;
                        }
                        console.log(`文件 '${file}' 重命名为 '${newFileName}'`);
                    });
                }
            });
        });
    });
}

// 移除空文件夹
function removeEmptyFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('检查文件夹是否为空时出错:', err);
            return;
        }

        // 如果文件夹为空，删除该文件夹
        if (files.length === 0) {
            fs.rmdir(folderPath, (err) => {
                if (err) {
                    console.error('删除空文件夹失败:', err);
                    return;
                }
                console.log(`空文件夹 '${folderPath}' 已删除`);
            });
        }
    });
}

// 执行修改
renameFolderAndFiles(mainFolderPath);
