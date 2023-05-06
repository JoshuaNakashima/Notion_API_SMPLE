const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = '../secret/.env';
const INS_FILE = '../secret/masters.json'

// 設定ファイルを読み込む
dotenv.config({path: ENV_FILE});

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const targetPageId = process.env.TARGET_PAGE_ID

(async () => {
    const pageId = targetPageId;
    const response = await notion.pages.retrieve({ page_id: pageId });
    console.log(response);
    console.log(response.properties.データ移動.date);
})();