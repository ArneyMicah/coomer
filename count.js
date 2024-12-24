// 计算单页数量
import fs from "fs/promises"; // 使用fs.promises API来支持异步操作

const filePath = './1.json';

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

const getTotalCount = async () => {
    const data = await readData();
    if (data) {
        // 使用 reduce 计算所有数组中条目的总和
        const totalCount = data.reduce((acc, item) => acc + item.length, 0);
        console.log(`总条数: ${totalCount}`);
    } else {
        console.log("没有数据可计算");
    }
};

getTotalCount();

