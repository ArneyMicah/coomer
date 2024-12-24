import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import cliProgress from 'cli-progress'; // To display a progress bar

// 设置代理（可选）
const agent = new HttpsProxyAgent({
    host: '127.0.0.1',
    port: 7890,
});

// 全局下载目录
const DOWNLOAD_DIR = 'D:/nana_taipei';
const filePath = './deerlong1.json';
let newData = [];
let totalVideos = 0;  // 总视频数
let downloadedVideos = 0;  // 已下载的视频数
let failedDownloads = [];  // 记录下载失败的文件

// 使用 async/await 来确保文件读取完成后才执行 main 函数
const readFile = async () => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`无法读取文件: ${filePath}`);
                console.error(err);
                reject(err);
                return;
            }
            newData = JSON.parse(data);
            resolve();
        });
    });
};

// 提取文件名的方法
const getFileNameFromUrl = (url) => {
    const urlObj = new URL(url);
    const fileNameWithQuery = path.basename(urlObj.pathname);
    const queryParams = urlObj.searchParams.get('f');
    if (queryParams) {
        return queryParams;
    }
    return fileNameWithQuery;
};

// 下载文件并支持断点续传和进度追踪
const downloadFileWithProgress = async (url, folderPath, fileName, filePath, retries = 3) => {
    const writer = fs.createWriteStream(filePath, { flags: 'a' }); // 以追加模式打开文件
    let fileSize = 0;

    // 获取已下载文件的大小，如果文件存在
    if (fs.existsSync(filePath)) {
        fileSize = fs.statSync(filePath).size;
    }

    // 获取文件总大小
    const headResponse = await axios.head(url, { httpsAgent: agent, timeout: 30000 });
    const totalLength = parseInt(headResponse.headers['content-length'], 10);

    // 如果 Range 请求头的起始位置超过文件大小，重置文件并从头开始下载
    if (fileSize >= totalLength) {
        console.log(`文件已经完全下载: ${fileName}`);
        return true; // 文件已经完整下载，不需要重新下载
    }

    // 设置 Range 请求头，指示从已下载的部分继续下载
    const headers = fileSize > 0 ? { Range: `bytes=${fileSize}-${totalLength - 1}` } : {};

    let attempt = 0;
    while (attempt < retries) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                headers: headers,
                httpsAgent: agent,
                timeout: 60000,  // 设置下载超时为 60 秒
            });

            let downloaded = fileSize;
            const progressBar = new cliProgress.SingleBar({
                format: '下载进度 |' + '{bar}' + '| {percentage}% | {value}/{total} 下载中',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            }, cliProgress.Presets.shades_classic);

            progressBar.start(totalLength, downloaded);

            // 监听文件下载进度
            response.data.on('data', (chunk) => {
                downloaded += chunk.length;
                progressBar.update(downloaded);
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    progressBar.stop();
                    console.log(`\n文件下载完成: ${fileName}`);
                    resolve(true);
                });

                writer.on('error', (err) => {
                    progressBar.stop();
                    console.error(`下载失败: ${fileName}`, err);
                    reject(false);
                });
            });
        } catch (error) {
            attempt++;
            console.error(`下载失败，第 ${attempt} 次重试: ${fileName}`);
            if (error.response) {
                console.error(`响应错误: ${error.response.status}, ${error.response.statusText}`);
            } else if (error.code) {
                console.error(`网络错误: ${error.code}`);
            } else {
                console.error(`其他错误: ${error.message}`);
            }

            // 延迟再重试
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // 使用指数退避延迟
            } else {
                console.error(`重试失败，终止下载: ${fileName}`);
                failedDownloads.push(fileName); // 记录失败的文件
                return false;
            }
        }
    }
};

// 下载文件的完整逻辑（包括附件和内容）
const downloadFiles = async (item, index) => {
    const folderName = item.published.replace(/[<>:"/\\|?*]/g, '_'); // 使用 published 作为文件夹名，替换非法字符
    const folderPath = path.join(DOWNLOAD_DIR, folderName); // 使用全局变量作为根目录路径
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // 如果 content 有值，写入 content.txt 文件
    if (item.content) {
        const contentFilePath = path.join(folderPath, 'content.txt');
        fs.writeFileSync(contentFilePath, item.content, 'utf8');
        console.log(`内容已写入: ${contentFilePath}`);
    }

    // 下载 result_attachments 中的文件
    if (item.result_attachments && item.result_attachments.length > 0) {
        for (const attachment of item.result_attachments) {
            const fileName = getFileNameFromUrl(attachment.server);
            const filePath = path.join(folderPath, fileName);
            const downloadSuccess = await downloadFileWithProgress(attachment.server, folderPath, fileName, filePath, 5); // 最大重试次数为 5
            if (downloadSuccess) {
                downloadedVideos++;
            }
        }
    }

    // 删除已成功下载的项目数据
    newData.splice(index, 1);

    // 更新 JSON 文件
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`已删除下载完成的数据项，并更新 JSON 文件`);
};

// 主逻辑：读取文件、处理每个项目并下载
const main = async () => {
    try {
        await readFile();  // 等待文件读取完成
        totalVideos = newData.length; // 获取视频总数
        for (let i = 0; i < newData.length; i++) {
            const item = newData[i];
            console.log(`正在处理: ${item.title}`);
            await downloadFiles(item, i);
        }

        // 打印下载统计
        console.log(`\n总共获取到 ${totalVideos} 个视频，已成功下载 ${downloadedVideos} 个视频。`);

        // 如果有失败的下载，记录到文件
        if (failedDownloads.length > 0) {
            const failedFilePath = path.join(__dirname, 'failed_downloads.txt');
            fs.writeFileSync(failedFilePath, failedDownloads.join('\n'), 'utf8');
            console.log(`下载失败的文件已记录在 ${failedFilePath}`);
        }
    } catch (err) {
        console.error('执行过程中发生错误:', err);
    }
};

// 启动下载任务
main();
