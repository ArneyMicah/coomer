// 计算所有attachment数量
import fs from "fs/promises"; // 使用fs.promises API来支持异步操作

const filePath = '路径';

// 异步读取数据
const readData = async () => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data); // 解析JSON
    } catch (error) {
        console.error(`无法读取文件: ${filePath}`);
        console.error(error);
        return null;
    }
};

readData()
    .then(data => {
        if (data) {
            // 计算 result_attachments 的总长度
            const count = data.reduce((total, item) => total + (item.result_attachments ? item.result_attachments.length : 0), 0);
            console.log(`共有 ${count} 条 server 数据`);

            // 打印出所有 item.result_attachments 中的 server 值
            data.forEach(item => {
                
                if (item.result_attachments && Array.isArray(item.result_attachments)) {
                    item.result_attachments.forEach(attachment => {
                        if (attachment.server) {
                            // console.log(`${item.published.replace('T', ' ').replace(/:/g, '-')}: ${attachment.server}`); // 打印 attachment 中的 server 值
                            console.log(attachment.server); // 打印 attachment 中的 server 值
                        }
                    });
                }
            });
        } else {
            console.log("没有数据");
        }
    })
    .catch(err => {
        console.error("读取过程中发生错误", err);
    });
