// Notion APIクライアントを初期化する
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// 設定ファイルを読み込む
dotenv.config({path: "./secret/.env"});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const fs = require('fs');

const data = {
  name: 'John Doe',
  age: 30,
  hobbies: ['reading', 'running', 'swimming'],
};

// 全てのDBを取得する。
(async () => {
  const blockId = process.env.NOTION_MASTER_BLOCK_ID;
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 150,
  });
  const blocks = response.results;

  // JSONに変換するオブジェクト
  const masters = {};

  blocks.forEach(block => {
    if (block.type !== 'child_database') return;

    const matches = block.child_database.title.match(/（(.+)）/);
    const keys = matches[1]; // カッコに囲まれた部分のみ取得

    keys.split(',').forEach(key => {
      masters[key] = block.id;
    });
  });

  // JSONに変換してファイルに書き出し
  fs.writeFileSync('./secret/masters.json', JSON.stringify(masters));

})();
