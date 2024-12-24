// 获取博主信息
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';

// 创建代理实例
const agent = new HttpsProxyAgent({
    host: process.env.PROXY_HOST || '127.0.0.1',
    port: process.env.PROXY_PORT || 7890,
});

const type = "onlyfans";  // 可变字段：type
const search = "";  // 可变字段：search
const totalPages = ;  // 总页数（例如：6）

// 获取页面内容的函数，支持重试机制
const getHtmlWithRetry = async (url, retries = 10) => {
    try {
        const { data } = await axios.get(url, { httpsAgent: agent });
        return data;
    } catch (error) {
        if (retries > 0) {
            console.log(`[${new Date().toISOString()}] 请求失败，正在重试... 剩余重试次数: ${retries}`);
            await delay(5000); // 重试间隔 5 秒
            return getHtmlWithRetry(url, retries - 1);
        }
        console.error(`[${new Date().toISOString()}] 请求失败，重试次数已耗尽: ${error.message}`);
        return null;
    }
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 处理附件数据的通用函数
const processAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return [];
    return attachments.map((attachment) => ({
        server: attachment.server + "/data" + attachment.path,
        name: attachment.name,
    }));
};

// 获取帖子数据
const getPostsLegacy = async (type, search, totalPages) => {
    try {
        let allResults = [];  // 用来存储所有页面的帖子数据
        const pagePromises = [];

        // 遍历每一页，使用并发请求
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * 50; // 计算每一页的偏移量
            const url = `https://coomer.su/api/v1/${type}/user/${search}/posts-legacy?o=${offset}`;

            const pageRequest = axios.get(url, { httpsAgent: agent })
                .then(({ data }) => {
                    // 处理附件数据
                    const processedAttachments = data.result_attachments.map(processAttachments);
                    const previewsData = data.result_previews.map(processAttachments);

                    // 将附件数据添加到每一条帖子中并删除指定字段
                    data.results = data.results.map((response, index) => {
                        // 删除指定字段
                        delete response.id;
                        delete response.user;
                        delete response.file;
                        delete response.attachments;

                        // 添加附件数据
                        response.result_attachments = processedAttachments[index] || [];
                        response.result_previews = previewsData[index] || [];

                        return response;
                    });

                    // 将当前页面的帖子数据添加到 allResults 数组中
                    allResults = [...allResults, ...data.results];

                    console.log(`[${new Date().toISOString()}] 第 ${page} 页 数据获取成功`);
                })
                .catch((error) => {
                    console.error(`[${new Date().toISOString()}] 第 ${page} 页 数据获取失败:`, error.message);
                });

            pagePromises.push(pageRequest);
        }

        // 等待所有页面的数据获取完成
        await Promise.allSettled(pagePromises);

        // 将所有页面的数据写入 JSON 文件
        fs.writeFileSync(`./${search}.json`, JSON.stringify(allResults, null, 2));
        console.log(`[${new Date().toISOString()}] 所有帖子数据已成功保存。`);

        return allResults;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 获取帖子数据失败:`, error);
        return null;
    }
};

// main 函数作为入口函数
const main = async () => {
    try {
        console.log(`[${new Date().toISOString()}] 开始获取用户帖子数据...`);
        const postsData = await getPostsLegacy(type, search, totalPages);
        if (postsData) {
            console.log(`[${new Date().toISOString()}] 所有帖子数据已成功保存。`);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 程序运行出错:`, error);
    }
};

// 执行 main 函数
main();
