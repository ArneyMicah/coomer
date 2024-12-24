import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 创建代理实例
const agent = new HttpsProxyAgent({
    host: '127.0.0.1',
    port: 7890,
});

// 创建 axios 实例
const instance = axios.create({
    baseURL: "https://coomer.su/api/v1/",
    timeout: 100000,
    httpsAgent: agent,  // 使用代理
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36',
    },
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        console.error('请求错误:', error);  // 用 console.error 代替 alert
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        console.error('响应错误:', error);  // 用 console.error 代替 alert
        return Promise.reject(error);
    }
);

export default instance;
