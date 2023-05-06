const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = '../secret/.env';
const INS_FILE = '../secret/masters.json'

// 設定ファイルを読み込む
dotenv.config({path: ENV_FILE});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// https://www.notion.so/katatsukuri/9e34fba2f0cb41dd926d912a4e5d7bb4?pvs=4
(async () => {
    const pageId = '9e34fba2-f0cb-41dd-926d-912a4e5d7bb4';
    const response = await notion.pages.retrieve({ page_id: pageId });
    console.log(response);
    console.log(response.properties.データ移動.date);
})();